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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LaundryJobService {

    @Autowired
    private LaundryJobRepository laundryJobRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private SmsService smsService;

    @Autowired
    private NotificationService notificationService;

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
            "wash only", List.of(STATUS_NOT_STARTED, STATUS_WASHING, STATUS_WASHED, STATUS_COMPLETED),
            "dry", List.of(STATUS_NOT_STARTED, STATUS_DRYING, STATUS_DRIED, STATUS_FOLDING, STATUS_COMPLETED),
            "dry only", List.of(STATUS_NOT_STARTED, STATUS_DRYING, STATUS_DRIED, STATUS_FOLDING, STATUS_COMPLETED));

    private List<String> getFlowByServiceType(String serviceType) {
        if (serviceType == null) {
            return List.of(STATUS_NOT_STARTED, "IN_PROGRESS", STATUS_COMPLETED);
        }

        String normalizedType = serviceType.toLowerCase().trim();
        return SERVICE_FLOWS.getOrDefault(
                normalizedType,
                List.of(STATUS_NOT_STARTED, "IN_PROGRESS", STATUS_COMPLETED));
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
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
        job.setContact(txn.getContact());
        job.setLoadAssignments(assignments);
        job.setDetergentQty(dto.getDetergentQty());
        job.setFabricQty(dto.getFabricQty());

        String serviceType = txn.getServiceName();
        job.setServiceType(serviceType);
        job.setStatusFlow(getFlowByServiceType(serviceType));
        job.setCurrentStep(0);
        job.setPickupStatus("UNCLAIMED");

        if (txn.getDueDate() != null) {
            job.setDueDate(txn.getDueDate());
        } else {
            job.setDueDate(LocalDateTime.now().plusDays(3));
        }
        job.setExpired(false);

        System.out.println("Creating laundry job with serviceType: " + serviceType +
                " and dueDate: " + job.getDueDate() +
                " for transaction: " + dto.getTransactionId());

        return laundryJobRepository.save(job);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob assignMachine(String transactionId, int loadNumber, String machineId, String processedBy) {
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

        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob startLoad(String transactionId, int loadNumber, Integer durationMinutes, String processedBy) {
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

        MachineItem machine = machineRepository.findById(load.getMachineId())
                .orElseThrow(() -> new RuntimeException("Machine not found"));
        machine.setStatus(STATUS_IN_USE);
        machineRepository.save(machine);

        job.setLaundryProcessedBy(processedBy);
        LaundryJob saved = laundryJobRepository.save(job);

        if (STATUS_WASHING.equals(nextStatus) || STATUS_DRYING.equals(nextStatus)) {
            scheduler.schedule(() -> autoAdvanceAfterStepEnds(serviceType, transactionId, loadNumber),
                    finalDuration, TimeUnit.MINUTES);
        }

        return saved;
    }

    public void syncTimerStates(LaundryJob job) {
        LocalDateTime now = LocalDateTime.now();

        for (LoadAssignment load : job.getLoadAssignments()) {
            if ((STATUS_WASHING.equals(load.getStatus()) || STATUS_DRYING.equals(load.getStatus()))
                    && load.getEndTime() != null && now.isAfter(load.getEndTime())) {

                switch (load.getStatus()) {
                    case STATUS_WASHING:
                        load.setStatus(STATUS_WASHED);
                        releaseMachine(load);
                        break;
                    case STATUS_DRYING:
                        load.setStatus(STATUS_DRIED);
                        releaseMachine(load);
                        break;
                }

                if (STATUS_WASHED.equals(load.getStatus())) {
                    Transaction txn = transactionRepository.findByInvoiceNumber(job.getTransactionId()).orElse(null);
                    String serviceType = (txn != null ? txn.getServiceName() : "wash");

                    if ("wash & dry".equalsIgnoreCase(serviceType)) {
                        load.setStatus(STATUS_DRYING);
                        load.setStartTime(now);
                        int dryDuration = load.getDurationMinutes() != null ? load.getDurationMinutes() : 40;
                        load.setEndTime(now.plusMinutes(dryDuration));

                        scheduler.schedule(
                                () -> autoAdvanceAfterStepEnds(serviceType, job.getTransactionId(),
                                        load.getLoadNumber()),
                                dryDuration, TimeUnit.MINUTES);
                    }
                }
            }
        }
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob dryAgain(String transactionId, int loadNumber, String processedBy) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        if (!STATUS_DRIED.equalsIgnoreCase(load.getStatus())) {
            throw new RuntimeException("Can only dry again from DRIED status");
        }

        load.setStatus(STATUS_DRYING);
        load.setStartTime(LocalDateTime.now());

        int duration = (load.getDurationMinutes() != null && load.getDurationMinutes() > 0)
                ? load.getDurationMinutes()
                : 40;

        load.setEndTime(LocalDateTime.now().plusMinutes(duration));

        if (load.getMachineId() == null) {
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
            machineRepository.findById(load.getMachineId()).ifPresent(machine -> {
                machine.setStatus(STATUS_IN_USE);
                machineRepository.save(machine);
            });
        }

        job.setLaundryProcessedBy(processedBy);
        LaundryJob saved = laundryJobRepository.save(job);

        scheduler.schedule(() -> autoAdvanceAfterStepEnds("dry", transactionId, loadNumber),
                duration, TimeUnit.MINUTES);

        return saved;
    }

    private String determineNextStatus(String serviceType, LoadAssignment load) {
        if (serviceType == null) {
            return load.getStatus();
        }

        String normalizedType = serviceType.toLowerCase().trim();

        switch (normalizedType) {
            case "wash":
            case "wash only":
                if (STATUS_NOT_STARTED.equals(load.getStatus()))
                    return STATUS_WASHING;
                break;
            case "dry":
            case "dry only":
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
        return load.getStatus();
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob advanceLoad(String transactionId, int loadNumber, String newStatus, String processedBy) {
        if ("COMPLETE".equalsIgnoreCase(newStatus)) {
            newStatus = STATUS_COMPLETED;
        }

        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        String previousStatus = load.getStatus();
        load.setStatus(newStatus);

        sendStatusChangeNotifications(job, load, previousStatus, newStatus);

        if (STATUS_WASHED.equalsIgnoreCase(newStatus) || STATUS_DRIED.equalsIgnoreCase(newStatus)) {
            releaseMachine(load);
        }

        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    private synchronized void autoAdvanceAfterStepEnds(String serviceType, String transactionId, int loadNumber) {
        try {
            LaundryJob job = findSingleJobByTransaction(transactionId);
            Transaction txn = transactionRepository.findByInvoiceNumber(transactionId).orElse(null);
            String svc = (txn != null ? txn.getServiceName() : serviceType);

            LoadAssignment load = job.getLoadAssignments().stream()
                    .filter(l -> l.getLoadNumber() == loadNumber)
                    .findFirst()
                    .orElse(null);

            if (load == null)
                return;

            String previousStatus = load.getStatus();
            if (STATUS_COMPLETED.equals(previousStatus) || STATUS_FOLDING.equals(previousStatus))
                return;

            if (load.getEndTime() != null && LocalDateTime.now().isAfter(load.getEndTime())) {
                switch (previousStatus.toUpperCase()) {
                    case STATUS_WASHING:
                        load.setStatus(STATUS_WASHED);
                        releaseMachine(load);
                        break;
                    case STATUS_DRYING:
                        load.setStatus(STATUS_DRIED);
                        releaseMachine(load);
                        break;
                }

                sendStatusChangeNotifications(job, load, previousStatus, load.getStatus());
                laundryJobRepository.save(job);
                System.out.println(
                        "Auto-advanced load " + loadNumber + " from " + previousStatus + " to " + load.getStatus());
            }
        } catch (Exception e) {
            System.err.println("Error in autoAdvanceAfterStepEnds: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void sendStatusChangeNotifications(LaundryJob job, LoadAssignment load, String previousStatus,
            String newStatus) {
        try {
            if ("WASHED".equalsIgnoreCase(newStatus) && !"WASHED".equalsIgnoreCase(previousStatus)) {
                notificationService.notifyLoadWashed(
                        job.getCustomerName(),
                        job.getTransactionId(),
                        load.getLoadNumber());
            }

            if ("DRIED".equalsIgnoreCase(newStatus) && !"DRIED".equalsIgnoreCase(previousStatus)) {
                notificationService.notifyLoadDried(
                        job.getCustomerName(),
                        job.getTransactionId(),
                        load.getLoadNumber());
            }

            if ("COMPLETED".equalsIgnoreCase(newStatus) && !"COMPLETED".equalsIgnoreCase(previousStatus)) {
                notificationService.notifyLoadCompleted(
                        job.getCustomerName(),
                        job.getTransactionId(),
                        load.getLoadNumber());
            }

        } catch (Exception e) {
            System.err.println("❌ Failed to send status change notification: " + e.getMessage());
        }
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob completeLoad(String transactionId, int loadNumber, String processedBy) {
        LaundryJob job = advanceLoad(transactionId, loadNumber, STATUS_COMPLETED, processedBy);

        sendCompletionSmsNotification(job, loadNumber);

        try {
            String title = "Load Completed";
            String message = String.format(
                    "Load %d for %s has been completed. Transaction: %s",
                    loadNumber,
                    job.getCustomerName(),
                    job.getTransactionId());

            notificationService.notifyAllUsers(
                    "load_completed",
                    title,
                    message,
                    job.getTransactionId());
        } catch (Exception e) {
            System.err.println("❌ Failed to send completion notification: " + e.getMessage());
        }

        return job;
    }

    private void sendCompletionSmsNotification(LaundryJob job, int loadNumber) {
        System.out.println("🎯 sendCompletionSmsNotification called!");
        System.out.println("🎯 Job: " + job.getTransactionId());
        System.out.println("🎯 Customer: " + job.getCustomerName());
        System.out.println("🎯 Contact: " + job.getContact());
        System.out.println("🎯 Load that triggered completion: " + loadNumber);

        try {
            boolean allLoadsCompleted = job.getLoadAssignments().stream()
                    .allMatch(load -> STATUS_COMPLETED.equalsIgnoreCase(load.getStatus()));

            System.out.println("🎯 All loads completed: " + allLoadsCompleted);

            System.out.println("🎯 Load statuses:");
            job.getLoadAssignments().forEach(load -> {
                System.out.println("   - Load " + load.getLoadNumber() + ": " + load.getStatus() +
                        " (Machine: " + load.getMachineId() + ")");
            });

            if (allLoadsCompleted) {
                System.out.println("🚀 ALL LOADS COMPLETED! Sending SMS notification...");

                Transaction transaction = transactionRepository.findByInvoiceNumber(job.getTransactionId())
                        .orElse(null);

                String serviceType = transaction != null ? transaction.getServiceName() : "laundry";

                System.out.println("📱 SMS Details:");
                System.out.println("   📞 Phone: " + job.getContact());
                System.out.println("   👤 Customer: " + job.getCustomerName());
                System.out.println("   🛠️ Service: " + serviceType);

                smsService.sendLoadCompletedNotification(
                        job.getContact(),
                        job.getCustomerName(),
                        serviceType);

                System.out.println("✅ SMS notification process completed for job: " + job.getTransactionId());

            } else {
                System.out.println("⏳ Not all loads completed yet. Skipping SMS.");
                int completedCount = (int) job.getLoadAssignments().stream()
                        .filter(load -> STATUS_COMPLETED.equalsIgnoreCase(load.getStatus()))
                        .count();
                System.out.println("⏳ Completed: " + completedCount + "/" + job.getLoadAssignments().size());
            }
        } catch (Exception e) {
            System.err.println("❌ Error in sendCompletionSmsNotification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob updateLoadDuration(String transactionId, int loadNumber, int durationMinutes,
            String processedBy) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: : " + loadNumber));

        load.setDurationMinutes(durationMinutes);
        if (load.getStartTime() != null) {
            load.setEndTime(load.getStartTime().plusMinutes(durationMinutes));
        }

        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob updateCurrentStep(String transactionId, int newStep, String processedBy) {
        LaundryJob job = findSingleJobByTransaction(transactionId);
        job.setCurrentStep(newStep);
        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob updateJob(LaundryJob job, String processedBy) {
        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public boolean deleteJobById(String id, String processedBy) {
        if (!laundryJobRepository.existsById(id))
            return false;

        LaundryJob job = laundryJobRepository.findById(id).orElse(null);
        if (job != null) {
            job.setLaundryProcessedBy(processedBy);
            laundryJobRepository.save(job);
        }

        laundryJobRepository.deleteById(id);
        return true;
    }

    @Cacheable(value = "laundryJobs", key = "'allJobs-' + #page + '-' + #size")
    public List<LaundryJobDto> getAllJobs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());
        Page<LaundryJob> jobPage = laundryJobRepository.findAll(pageable);
        List<LaundryJob> jobs = jobPage.getContent();

        // Filter out ONLY jobs where ALL loads are COMPLETED
        List<LaundryJob> nonCompletedJobs = jobs.stream()
                .filter(job -> job.getLoadAssignments() != null)
                .filter(job -> !job.getLoadAssignments().stream()
                        .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
                .collect(Collectors.toList());

        System.out.println("Returning " + nonCompletedJobs.size() + " non-completed jobs out of " + jobs.size() + " total jobs");
        return processJobsToDtos(nonCompletedJobs);
    }

    @Cacheable(value = "laundryJobs", key = "'allJobs'")
    public List<LaundryJobDto> getAllJobs() {
        List<LaundryJob> jobs = laundryJobRepository.findAll();

        // Filter out ONLY jobs where ALL loads are COMPLETED
        List<LaundryJob> nonCompletedJobs = jobs.stream()
                .filter(job -> job.getLoadAssignments() != null)
                .filter(job -> !job.getLoadAssignments().stream()
                        .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
                .collect(Collectors.toList());

        System.out.println("Returning " + nonCompletedJobs.size() + " non-completed jobs out of " + jobs.size() + " total jobs");
        return processJobsToDtos(nonCompletedJobs);
    }

    private List<LaundryJobDto> processJobsToDtos(List<LaundryJob> jobs) {
    System.out.println("Processing " + jobs.size() + " jobs to DTOs");
    
    if (jobs.isEmpty()) {
        System.out.println("No jobs to process");
        return Collections.emptyList();
    }

    // Log each job being processed
    for (LaundryJob job : jobs) {
        System.out.println("Processing job: " + job.getTransactionId() + 
                          ", Customer: " + job.getCustomerName() +
                          ", Loads: " + (job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0));
        
        if (job.getLoadAssignments() != null) {
            for (LoadAssignment load : job.getLoadAssignments()) {
                System.out.println("  Load " + load.getLoadNumber() + ": " + load.getStatus() +
                                 ", Duration: " + load.getDurationMinutes() +
                                 ", StartTime: " + load.getStartTime() +
                                 ", EndTime: " + load.getEndTime());
            }
        }
    }

    Set<String> transactionIds = jobs.stream()
            .map(LaundryJob::getTransactionId)
            .collect(Collectors.toSet());

    List<Transaction> transactions = transactionRepository.findByInvoiceNumberIn(new ArrayList<>(transactionIds));
    Map<String, Transaction> transactionMap = transactions.stream()
            .collect(Collectors.toMap(Transaction::getInvoiceNumber, Function.identity()));

    List<LaundryJobDto> result = new ArrayList<>();

    for (LaundryJob job : jobs) {
        Transaction tx = transactionMap.get(job.getTransactionId());

        int detergentQty = 0;
        int fabricQty = 0;
        LocalDateTime issueDate = null;
        String serviceType = job.getServiceType();
        String contact = job.getContact();

        if (tx != null) {
            issueDate = tx.getIssueDate();
            serviceType = tx.getServiceName() != null ? tx.getServiceName() : job.getServiceType();

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

        System.out.println("Creating DTO for job - Transaction: " + job.getTransactionId() +
                ", Service Type: " + serviceType);

        LaundryJobDto dto = new LaundryJobDto();
        dto.setTransactionId(job.getTransactionId());
        dto.setCustomerName(job.getCustomerName());
        dto.setContact(contact);
        dto.setLoadAssignments(job.getLoadAssignments());
        dto.setDetergentQty(detergentQty);
        dto.setFabricQty(fabricQty);
        dto.setStatusFlow(job.getStatusFlow());
        dto.setCurrentStep(job.getCurrentStep());
        dto.setIssueDate(issueDate);
        dto.setServiceType(serviceType);
        dto.setTotalLoads(job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0);

        result.add(dto);
    }

    System.out.println("Successfully processed " + result.size() + " job DTOs");
    return result;
}

    public LaundryJob findSingleJobByTransaction(String transactionId) {
        return laundryJobRepository.findByTransactionId(transactionId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Laundry job not found for transaction: " + transactionId));
    }

    private void releaseMachine(LoadAssignment load) {
        if (load.getMachineId() != null) {
            machineRepository.findById(load.getMachineId()).ifPresent(machine -> {
                machine.setStatus(STATUS_AVAILABLE);
                machineRepository.save(machine);
            });
        }
    }

    public List<LaundryJob> getCompletedUnclaimedJobs() {
        return laundryJobRepository.findAll().stream()
                .filter(job -> job.getLoadAssignments() != null &&
                        job.getLoadAssignments().stream()
                                .allMatch(load -> STATUS_COMPLETED.equalsIgnoreCase(load.getStatus())))
                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                .filter(job -> !job.isExpired())
                .collect(Collectors.toList());
    }

    public List<LaundryJob> getExpiredJobs() {
        return laundryJobRepository.findByExpiredTrueAndDisposedFalse();
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob disposeJob(String id, String processedBy) {
        LaundryJob job = laundryJobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Laundry job not found: " + id));

        if (!job.isExpired()) {
            throw new RuntimeException("Cannot dispose non-expired job");
        }

        if (job.isDisposed()) {
            throw new RuntimeException("Job already disposed");
        }

        job.setDisposed(true);
        job.setDisposedBy(processedBy);
        job.setDisposedDate(LocalDateTime.now());
        return laundryJobRepository.save(job);
    }

    public List<LaundryJob> getDisposedJobs() {
        return laundryJobRepository.findByDisposedTrue();
    }

    @Scheduled(fixedRate = 3600000)
    public void checkForExpiredJobs() {
        LocalDateTime now = LocalDateTime.now();
        List<LaundryJob> unclaimedJobs = laundryJobRepository.findByPickupStatus("UNCLAIMED");

        for (LaundryJob job : unclaimedJobs) {
            if (job.isDisposed()) {
                continue;
            }

            if (job.getDueDate() != null && now.isAfter(job.getDueDate()) && !job.isExpired()) {
                job.setExpired(true);
                laundryJobRepository.save(job);
                System.out.println("Job expired: " + job.getTransactionId() + " - " + job.getCustomerName());
            }
        }
    }

    public List<LaundryJob> searchLaundryJobsByCustomerName(String customerName) {
        return laundryJobRepository.findByCustomerName(customerName);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob forceAdvanceLoad(String transactionId, int loadNumber, String processedBy) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        String currentStatus = load.getStatus();
        String newStatus = currentStatus;

        switch (currentStatus.toUpperCase()) {
            case STATUS_WASHING:
                newStatus = STATUS_WASHED;
                releaseMachine(load);
                break;
            case STATUS_DRYING:
                newStatus = STATUS_DRIED;
                releaseMachine(load);
                break;
            case STATUS_WASHED:
                newStatus = STATUS_DRYING;
                break;
            case STATUS_DRIED:
                newStatus = STATUS_FOLDING;
                break;
            case STATUS_FOLDING:
                newStatus = STATUS_COMPLETED;
                break;
            default:
                throw new RuntimeException("Cannot force advance from status: " + currentStatus);
        }

        load.setStatus(newStatus);
        load.setStartTime(null);
        load.setEndTime(null);

        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }
}