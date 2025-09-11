package com.starwash.authservice.service;

import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.LaundryJob.LoadAssignment;
import com.starwash.authservice.model.MachineItem;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.MachineRepository;
import com.starwash.authservice.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class LaundryJobService {

    @Autowired
    private LaundryJobRepository laundryJobRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MachineRepository machineRepository;

    private static final String STATUS_AVAILABLE = "Available";
    private static final String STATUS_IN_USE = "In Use";

    private static final String STATUS_NOT_STARTED = "NOT_STARTED";
    private static final String STATUS_WASHING = "WASHING";
    private static final String STATUS_WASHED = "WASHED";
    private static final String STATUS_DRYING = "DRYING";
    private static final String STATUS_DRIED = "DRIED";
    private static final String STATUS_FOLDING = "FOLDING";
    private static final String STATUS_COMPLETED = "COMPLETED";

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    private static final Map<String, List<String>> SERVICE_FLOWS = Map.of(
            "wash & dry", List.of(STATUS_NOT_STARTED, STATUS_WASHING, STATUS_WASHED,
                    STATUS_DRYING, STATUS_DRIED, STATUS_FOLDING, STATUS_COMPLETED),
            "wash", List.of(STATUS_NOT_STARTED, STATUS_WASHING, STATUS_WASHED, STATUS_COMPLETED),
            "dry", List.of(STATUS_NOT_STARTED, STATUS_DRYING, STATUS_DRIED, STATUS_FOLDING, STATUS_COMPLETED));

    private List<String> getFlowByServiceType(String serviceType) {
        if (serviceType == null) {
            return List.of(STATUS_NOT_STARTED, "IN_PROGRESS", STATUS_COMPLETED);
        }
        return SERVICE_FLOWS.getOrDefault(
                serviceType.toLowerCase(),
                List.of(STATUS_NOT_STARTED, "IN_PROGRESS", STATUS_COMPLETED));
    }

    /** Create a new laundry job with loads */
    public LaundryJob createJob(LaundryJobDto dto) {
        Transaction txn = transactionRepository
                .findByInvoiceNumber(dto.getTransactionId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Transaction not found for invoice: " + dto.getTransactionId()));

        List<LoadAssignment> assignments = new ArrayList<>();
        for (int i = 1; i <= txn.getServiceQuantity(); i++) {
            assignments.add(new LoadAssignment(i, null, STATUS_NOT_STARTED, null, null, null));
        }

        LaundryJob job = new LaundryJob();
        job.setTransactionId(dto.getTransactionId());
        job.setCustomerName(txn.getCustomerName());
        job.setContact(txn.getContact()); // ✅ Save customer contact
        job.setLoadAssignments(assignments);
        job.setDetergentQty(dto.getDetergentQty());
        job.setFabricQty(dto.getFabricQty());
        job.setServiceType(txn.getServiceName());
        job.setStatusFlow(getFlowByServiceType(txn.getServiceName()));
        job.setCurrentStep(0);
        job.setPickupStatus("UNCLAIMED"); // Default pickup status
        
        // Set due date (7 days from now)
        job.setDueDate(LocalDateTime.now().plusDays(7));
        job.setExpired(false);

        return laundryJobRepository.save(job);
    }

    /** Assign machine */
    public LaundryJob assignMachine(String transactionId, int loadNumber, String machineId) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        MachineItem machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new RuntimeException("Machine not found"));

        if (!STATUS_AVAILABLE.equalsIgnoreCase(machine.getStatus())) {
            throw new RuntimeException("Machine is not available");
        }

        job.getLoadAssignments().stream()
                .filter(load -> load.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber))
                .setMachineId(machineId);

        return laundryJobRepository.save(job);
    }

    /** Start a load */
    public LaundryJob startLoad(String transactionId, int loadNumber, Integer durationMinutes) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        if (load.getMachineId() == null) {
            throw new RuntimeException("No machine assigned");
        }

        Transaction txn = transactionRepository.findByInvoiceNumber(transactionId).orElse(null);
        String serviceType = (txn != null ? txn.getServiceName() : "wash");

        // Determine next status
        String nextStatus = determineNextStatus(serviceType, load);

        int defaultDuration;
        switch (nextStatus) {
            case STATUS_WASHING -> defaultDuration = 35;
            case STATUS_DRYING -> defaultDuration = 40;
            default -> defaultDuration = 20;
        }

        int finalDuration = (durationMinutes != null && durationMinutes > 0) ? durationMinutes : defaultDuration;

        LocalDateTime now = LocalDateTime.now();
        load.setStatus(nextStatus);
        load.setStartTime(now);
        load.setDurationMinutes(finalDuration);
        load.setEndTime(now.plusMinutes(finalDuration));

        // Set machine to in-use
        MachineItem machine = machineRepository.findById(load.getMachineId())
                .orElseThrow(() -> new RuntimeException("Machine not found"));
        machine.setStatus(STATUS_IN_USE);
        machineRepository.save(machine);

        LaundryJob saved = laundryJobRepository.save(job);

        // Schedule auto-advance after duration
        scheduler.schedule(() -> autoAdvanceAfterStepEnds(serviceType, transactionId, loadNumber),
                finalDuration, TimeUnit.MINUTES);

        return saved;
    }

    /** Dry Again - Reset drying timer */
    public LaundryJob dryAgain(String transactionId, int loadNumber) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        if (!STATUS_DRIED.equalsIgnoreCase(load.getStatus())) {
            throw new RuntimeException("Can only dry again from DRIED status");
        }

        // Reset to DRYING status with new timer
        load.setStatus(STATUS_DRYING);
        load.setStartTime(LocalDateTime.now());

        // Use previous duration or default
        int duration = (load.getDurationMinutes() != null && load.getDurationMinutes() > 0)
                ? load.getDurationMinutes()
                : 40; // Default drying time

        load.setEndTime(LocalDateTime.now().plusMinutes(duration));

        // Assign machine if not already assigned
        if (load.getMachineId() == null) {
            // Find an available dryer
            Optional<MachineItem> availableDryer = machineRepository.findAll().stream()
                    .filter(m -> "DRYER".equalsIgnoreCase(m.getType()))
                    .filter(m -> STATUS_AVAILABLE.equalsIgnoreCase(m.getStatus()))
                    .findFirst();

            if (availableDryer.isPresent()) {
                MachineItem dryer = availableDryer.get();
                load.setMachineId(dryer.getId());
                dryer.setStatus(STATUS_IN_USE);
                machineRepository.save(dryer);
            } else {
                throw new RuntimeException("No available dryers found");
            }
        } else {
            // Reuse existing machine, set to in-use
            machineRepository.findById(load.getMachineId()).ifPresent(machine -> {
                machine.setStatus(STATUS_IN_USE);
                machineRepository.save(machine);
            });
        }

        LaundryJob saved = laundryJobRepository.save(job);

        // Schedule auto-advance after duration
        scheduler.schedule(() -> autoAdvanceAfterStepEnds("dry", transactionId, loadNumber),
                duration, TimeUnit.MINUTES);

        return saved;
    }

    /** Decide next status properly for Wash & Dry */
    private String determineNextStatus(String serviceType, LoadAssignment load) {
        serviceType = serviceType.toLowerCase();

        switch (serviceType) {
            case "wash":
                if (STATUS_NOT_STARTED.equals(load.getStatus()))
                    return STATUS_WASHING;
                break;
            case "dry":
                if (STATUS_NOT_STARTED.equals(load.getStatus()))
                    return STATUS_DRYING;
                break;
            case "wash & dry":
                if (STATUS_NOT_STARTED.equals(load.getStatus()))
                    return STATUS_WASHING;
                if (STATUS_WASHED.equals(load.getStatus()))
                    return STATUS_DRYING;
                break;
        }
        return load.getStatus(); // already in progress or completed
    }

    /** Manual advance */
    public LaundryJob advanceLoad(String transactionId, int loadNumber, String newStatus) {
        if ("COMPLETE".equalsIgnoreCase(newStatus)) {
            newStatus = STATUS_COMPLETED;
        }

        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        load.setStatus(newStatus);

        if (STATUS_WASHED.equalsIgnoreCase(newStatus) || STATUS_DRIED.equalsIgnoreCase(newStatus)) {
            releaseMachine(load);
        }

        return laundryJobRepository.save(job);
    }

    /** Mark completed */
    public LaundryJob completeLoad(String transactionId, int loadNumber) {
        return advanceLoad(transactionId, loadNumber, STATUS_COMPLETED);
    }

    /** Update duration */
    public LaundryJob updateLoadDuration(String transactionId, int loadNumber, int durationMinutes) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: : " + loadNumber));

        load.setDurationMinutes(durationMinutes);
        if (load.getStartTime() != null) {
            load.setEndTime(load.getStartTime().plusMinutes(durationMinutes));
        }

        return laundryJobRepository.save(job);
    }

    /** Update current step */
    public LaundryJob updateCurrentStep(String transactionId, int newStep) {
        LaundryJob job = findSingleJobByTransaction(transactionId);
        job.setCurrentStep(newStep);
        return laundryJobRepository.save(job);
    }

    /** Update whole job */
    public LaundryJob updateJob(LaundryJob job) {
        return laundryJobRepository.save(job);
    }

    /** Delete job by ID */
    public boolean deleteJobById(String id) {
        if (!laundryJobRepository.existsById(id))
            return false;
        laundryJobRepository.deleteById(id);
        return true;
    }

    /** Get all jobs */
    public List<LaundryJobDto> getAllJobs() {
        List<LaundryJob> jobs = laundryJobRepository.findAll();
        List<LaundryJobDto> result = new ArrayList<>();

        for (LaundryJob job : jobs) {
            Transaction tx = transactionRepository.findByInvoiceNumber(job.getTransactionId()).orElse(null);

            int detergentQty = 0;
            int fabricQty = 0;
            LocalDateTime issueDate = null;
            String serviceType = null;
            String contact = job.getContact(); // ✅ Get contact

            if (tx != null) {
                issueDate = tx.getIssueDate();
                serviceType = tx.getServiceName();

                if (tx.getConsumables() != null) {
                    detergentQty = tx.getConsumables().stream()
                            .filter(c -> c.getName().toLowerCase().contains("detergent"))
                            .mapToInt(c -> c.getQuantity())
                            .sum();

                    fabricQty = tx.getConsumables().stream()
                            .filter(c -> c.getName().toLowerCase().contains("fabric"))
                            .mapToInt(c -> c.getQuantity())
                            .sum();
                }
            }

            // Filter unfinished loads
            List<LoadAssignment> unfinishedLoads = new ArrayList<>();
            if (job.getLoadAssignments() != null) {
                for (LoadAssignment load : job.getLoadAssignments()) {
                    if (!STATUS_COMPLETED.equalsIgnoreCase(load.getStatus())) {
                        unfinishedLoads.add(load);
                    }
                }
            }

            if (!unfinishedLoads.isEmpty()) {
                LaundryJobDto dto = new LaundryJobDto();
                dto.setTransactionId(job.getTransactionId());
                dto.setCustomerName(job.getCustomerName());
                dto.setContact(contact); // ✅ Include contact in DTO
                dto.setLoadAssignments(unfinishedLoads);
                dto.setCurrentStep(job.getCurrentStep());
                dto.setStatusFlow(job.getStatusFlow());
                dto.setDetergentQty(detergentQty);
                dto.setFabricQty(fabricQty);
                dto.setIssueDate(issueDate);
                dto.setServiceType(serviceType);

                result.add(dto);
            }
        }

        return result;
    }

    /** Find single job by transaction */
    public LaundryJob findSingleJobByTransaction(String transactionId) {
        return laundryJobRepository.findByTransactionId(transactionId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Laundry job not found for transaction: " + transactionId));
    }

    /** Release machine */
    private void releaseMachine(LoadAssignment load) {
        if (load.getMachineId() != null) {
            machineRepository.findById(load.getMachineId()).ifPresent(machine -> {
                machine.setStatus(STATUS_AVAILABLE);
                machineRepository.save(machine);
            });
        }
    }

    /** Auto advance after step ends (only WASHING/DRYING) */
    private synchronized void autoAdvanceAfterStepEnds(String serviceType, String transactionId, int loadNumber) {
        LaundryJob job = findSingleJobByTransaction(transactionId);
        Transaction txn = transactionRepository.findByInvoiceNumber(transactionId).orElse(null);
        String svc = (txn != null ? txn.getServiceName() : serviceType);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElse(null);

        if (load == null)
            return;

        String status = load.getStatus();
        if (STATUS_COMPLETED.equals(status) || STATUS_FOLDING.equals(status))
            return;

        switch (status.toUpperCase()) {
            case STATUS_WASHING:
                load.setStatus(STATUS_WASHED);
                releaseMachine(load);
                break;
            case STATUS_DRYING:
                load.setStatus(STATUS_DRIED);
                releaseMachine(load);
                break;
        }

        laundryJobRepository.save(job);
    }

    /** Get completed but unclaimed jobs */
    public List<LaundryJob> getCompletedUnclaimedJobs() {
        return laundryJobRepository.findAll().stream()
                .filter(job -> job.getLoadAssignments() != null &&
                        job.getLoadAssignments().stream()
                                .allMatch(load -> STATUS_COMPLETED.equalsIgnoreCase(load.getStatus())))
                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                .filter(job -> !job.isExpired()) // Exclude expired jobs
                .collect(Collectors.toList());
    }
    
    /** Get expired jobs */
    public List<LaundryJob> getExpiredJobs() {
        return laundryJobRepository.findAll().stream()
                .filter(job -> job.isExpired())
                .collect(Collectors.toList());
    }
    
    /** Scheduled task to check for expired jobs (runs every hour) */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void checkForExpiredJobs() {
        LocalDateTime now = LocalDateTime.now();
        List<LaundryJob> unclaimedJobs = laundryJobRepository.findByPickupStatus("UNCLAIMED");
        
        for (LaundryJob job : unclaimedJobs) {
            if (job.getDueDate() != null && now.isAfter(job.getDueDate()) && !job.isExpired()) {
                job.setExpired(true);
                job.setExpirationDate(now);
                laundryJobRepository.save(job);
                // Log the expiration
                System.out.println("Job expired: " + job.getTransactionId() + " - " + job.getCustomerName());
            }
        }
    }
}