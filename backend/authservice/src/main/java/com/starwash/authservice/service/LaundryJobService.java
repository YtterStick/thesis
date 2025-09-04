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
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

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

    /** Scheduler for auto-advance */
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    /** Define service flows */
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
        job.setLoadAssignments(assignments);
        job.setDetergentQty(dto.getDetergentQty());
        job.setFabricQty(dto.getFabricQty());
        job.setStatusFlow(getFlowByServiceType(txn.getServiceName()));
        job.setCurrentStep(0);

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
        String nextStatus = determineNextStatus(serviceType, load);

        int defaultDuration = nextStatus.equals(STATUS_WASHING) ? 35 : 40;
        int finalDuration = (durationMinutes != null && durationMinutes > 0)
                ? durationMinutes
                : defaultDuration;

        LocalDateTime now = LocalDateTime.now();
        load.setStatus(nextStatus);
        load.setStartTime(now);
        load.setDurationMinutes(finalDuration);
        load.setEndTime(now.plusMinutes(finalDuration));

        MachineItem machine = machineRepository.findById(load.getMachineId())
                .orElseThrow(() -> new RuntimeException("Machine not found"));
        machine.setStatus(STATUS_IN_USE);
        machineRepository.save(machine);

        LaundryJob saved = laundryJobRepository.save(job);

        scheduler.schedule(() -> autoAdvanceAfterStepEnds(serviceType, transactionId, loadNumber),
                finalDuration, TimeUnit.MINUTES);

        return saved;
    }

    /** Decide which cycle comes next */
    private String determineNextStatus(String serviceType, LoadAssignment load) {
        if ("dry".equalsIgnoreCase(serviceType))
            return STATUS_DRYING;
        if ("wash".equalsIgnoreCase(serviceType))
            return STATUS_WASHING;

        return (load.getStatus() == null || STATUS_NOT_STARTED.equals(load.getStatus()))
                ? STATUS_WASHING
                : STATUS_DRYING;
    }

    /** Manual advance */
    public LaundryJob advanceLoad(String transactionId, int loadNumber, String newStatus) {
        // ✅ Normalize status
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
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        load.setDurationMinutes(durationMinutes);
        if (load.getStartTime() != null) {
            load.setEndTime(load.getStartTime().plusMinutes(durationMinutes));
        }

        return laundryJobRepository.save(job);
    }

    /** Update step */
    public LaundryJob updateCurrentStep(String transactionId, int newStep) {
        LaundryJob job = findSingleJobByTransaction(transactionId);
        job.setCurrentStep(newStep);
        return laundryJobRepository.save(job);
    }

    /** Update whole job */
    public LaundryJob updateJob(LaundryJob job) {
        return laundryJobRepository.save(job);
    }

    /** Delete by ID */
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

        // ✅ Filter out completed loads
        List<LoadAssignment> unfinishedLoads = new ArrayList<>();
        if (job.getLoadAssignments() != null) {
            for (LoadAssignment load : job.getLoadAssignments()) {
                if (!"COMPLETED".equalsIgnoreCase(load.getStatus())) {
                    unfinishedLoads.add(load);
                }
            }
        }

        // Only include job if it has unfinished loads
        if (!unfinishedLoads.isEmpty()) {
            LaundryJobDto dto = new LaundryJobDto();
            dto.setTransactionId(job.getTransactionId());
            dto.setCustomerName(job.getCustomerName());
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


    /** Find by transaction */
    public LaundryJob findSingleJobByTransaction(String transactionId) {
        return laundryJobRepository.findByTransactionId(transactionId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Laundry job not found for transaction: " + transactionId));
    }

    /* ================= Helpers ================= */

    private void releaseMachine(LoadAssignment load) {
        if (load.getMachineId() != null) {
            machineRepository.findById(load.getMachineId()).ifPresent(machine -> {
                machine.setStatus(STATUS_AVAILABLE);
                machineRepository.save(machine);
            });
        }
    }

    /** Auto advance only for washing/drying */
    private synchronized void autoAdvanceAfterStepEnds(String serviceType, String transactionId, int loadNumber) {
        LaundryJob job = findSingleJobByTransaction(transactionId);
        Transaction txn = transactionRepository.findByInvoiceNumber(transactionId).orElse(null);
        String svc = (txn != null ? txn.getServiceName() : serviceType);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElse(null);

        if (load == null) return;

        String status = load.getStatus();

        // 🚨 Prevent overwriting if already advanced
        if (STATUS_COMPLETED.equals(status) || STATUS_FOLDING.equals(status)) {
            return;
        }
        if (STATUS_WASHED.equals(status) && !"wash & dry".equalsIgnoreCase(svc)) {
            return;
        }
        if (STATUS_DRIED.equals(status) && "dry".equalsIgnoreCase(svc)) {
            return;
        }

        if (STATUS_WASHING.equalsIgnoreCase(status)) {
            load.setStatus(STATUS_WASHED);
            releaseMachine(load);

            if ("wash & dry".equalsIgnoreCase(svc)) {
                load.setStatus(STATUS_DRYING);
            }

        } else if (STATUS_DRYING.equalsIgnoreCase(status)) {
            load.setStatus(STATUS_DRIED);
            releaseMachine(load);

            if ("wash & dry".equalsIgnoreCase(svc)) {
                load.setStatus(STATUS_FOLDING);
            }
        }

        laundryJobRepository.save(job);
    }
}
