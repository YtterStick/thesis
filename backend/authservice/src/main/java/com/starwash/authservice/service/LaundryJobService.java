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
import java.time.ZoneId;
import java.util.*;
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

    private static final Map<String, List<String>> SERVICE_FLOWS = Map.of(
            "wash & dry", List.of(STATUS_NOT_STARTED, STATUS_WASHING, STATUS_WASHED,
                    STATUS_DRYING, STATUS_DRIED, STATUS_FOLDING, STATUS_COMPLETED),
            "wash", List.of(STATUS_NOT_STARTED, STATUS_WASHING, STATUS_WASHED, STATUS_COMPLETED),
            "dry", List.of(STATUS_NOT_STARTED, STATUS_DRYING, STATUS_DRIED, STATUS_FOLDING, STATUS_COMPLETED));

    private ZoneId getManilaTimeZone() {
        return ZoneId.of("Asia/Manila");
    }

    private LocalDateTime getCurrentManilaTime() {
        return LocalDateTime.now(getManilaTimeZone());
    }

    private List<String> getFlowByServiceType(String serviceType) {
        if (serviceType == null) {
            return List.of(STATUS_NOT_STARTED, "IN_PROGRESS", STATUS_COMPLETED);
        }
        return SERVICE_FLOWS.getOrDefault(
                serviceType.toLowerCase(),
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
        job.setServiceType(txn.getServiceName());
        job.setStatusFlow(getFlowByServiceType(txn.getServiceName()));
        job.setCurrentStep(0);
        job.setPickupStatus("UNCLAIMED");

        if (txn.getDueDate() != null) {
            job.setDueDate(txn.getDueDate());
        } else {
            job.setDueDate(getCurrentManilaTime().plusDays(3));
        }
        job.setExpired(false);

        System.out.println("🆕 Creating laundry job with dueDate: " + job.getDueDate() +
                " for transaction: " + dto.getTransactionId());

        return laundryJobRepository.save(job);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob assignMachine(String transactionId, int loadNumber, String machineId, String processedBy) {
        if (transactionId == null || machineId == null) {
            throw new IllegalArgumentException("Transaction ID and Machine ID must not be null");
        }
        LaundryJob job = findSingleJobByTransaction(transactionId);

        MachineItem machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new RuntimeException("Machine not found"));

        if (!STATUS_AVAILABLE.equalsIgnoreCase(machine.getStatus())) {
            throw new RuntimeException("Machine is not available");
        }

        // Validate machine type for current load status
        if (!isCorrectMachineTypeForLoad(job, loadNumber, machine)) {
            throw new RuntimeException("Invalid machine type for current load status");
        }

        job.getLoadAssignments().stream()
                .filter(load -> load.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber))
                .setMachineId(machineId);

        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }

    private boolean isCorrectMachineTypeForLoad(LaundryJob job, int loadNumber, MachineItem machine) {
        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElse(null);

        if (load == null)
            return false;

        String requiredType = getRequiredMachineType(load.getStatus(), job.getServiceType());
        return requiredType == null || requiredType.equalsIgnoreCase(machine.getType());
    }

    private String getRequiredMachineType(String status, String serviceType) {
        if (status == null)
            return null;

        switch (status.toUpperCase()) {
            case STATUS_WASHING:
                return "WASHER";
            case STATUS_DRYING:
                return "DRYER";
            case STATUS_WASHED:
            case STATUS_DRIED:
            case STATUS_FOLDING:
            case STATUS_COMPLETED:
                return null; // No machine required
            case STATUS_NOT_STARTED:
                // For NOT_STARTED, determine based on service type
                if (serviceType != null) {
                    if (serviceType.toLowerCase().contains("wash") && !serviceType.toLowerCase().contains("dry")) {
                        return "WASHER";
                    } else if (serviceType.toLowerCase().contains("dry")
                            && !serviceType.toLowerCase().contains("wash")) {
                        return "DRYER";
                    }
                }
                return null;
            default:
                return null;
        }
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob startLoad(String transactionId, int loadNumber, String processedBy) {
        if (transactionId == null) {
            throw new IllegalArgumentException("Transaction ID must not be null");
        }
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        String mid = load.getMachineId();
        if (mid == null) {
            throw new RuntimeException("No machine assigned");
        }
        MachineItem machine = machineRepository.findById(mid)
                .orElseThrow(() -> new RuntimeException("Machine not found"));

        Transaction txn = transactionRepository.findByInvoiceNumber(transactionId).orElse(null);
        String serviceType = (txn != null ? txn.getServiceName() : job.getServiceType());
        String nextStatus = determineNextStatus(serviceType, load);

        String requiredMachineType = getRequiredMachineType(nextStatus, serviceType);
        if (requiredMachineType != null && !requiredMachineType.equalsIgnoreCase(machine.getType())) {
            throw new RuntimeException("Invalid machine type for this step. Expected " +
                    requiredMachineType + " but got " + machine.getType());
        }

        load.setStatus(nextStatus);
        load.setStartTime(getCurrentManilaTime());

        machine.setStatus(STATUS_IN_USE);
        machineRepository.save(machine);

        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob dryAgain(String transactionId, int loadNumber, String processedBy) {
        if (transactionId == null) {
            throw new IllegalArgumentException("Transaction ID must not be null");
        }
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        if (!STATUS_DRIED.equalsIgnoreCase(load.getStatus())) {
            throw new RuntimeException("Can only dry again from DRIED status");
        }

        load.setStatus(STATUS_DRYING);
        load.setStartTime(getCurrentManilaTime());

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
            String mid = load.getMachineId();
            if (mid == null) {
                throw new RuntimeException("No machine assigned");
            }
            MachineItem machine = machineRepository.findById(mid)
                    .orElseThrow(() -> new RuntimeException("Machine not found"));

            if (!"DRYER".equalsIgnoreCase(machine.getType())) {
                throw new RuntimeException("Assigned machine is not a dryer");
            }

            machine.setStatus(STATUS_IN_USE);
            machineRepository.save(machine);
        }

        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }

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

        // FIXED: Release machine when moving to FOLDING or COMPLETED from any previous
        // status
        // This includes releasing from DRIED to FOLDING
        if ((STATUS_WASHING.equals(previousStatus) && STATUS_WASHED.equals(newStatus)) ||
                (STATUS_DRYING.equals(previousStatus) && STATUS_DRIED.equals(newStatus)) ||
                (STATUS_DRIED.equals(previousStatus)
                        && (STATUS_FOLDING.equals(newStatus) || STATUS_COMPLETED.equals(newStatus)))
                ||
                STATUS_COMPLETED.equals(newStatus)) {
            releaseMachine(load);
        }

        sendStatusChangeNotifications(job, load, previousStatus, newStatus);

        if (processedBy != null) {
            job.setLaundryProcessedBy(processedBy);
        }
        LaundryJob savedJob = laundryJobRepository.save(job);

        // ✅ ADDED: Check if all loads are completed and send SMS
        if (STATUS_COMPLETED.equals(newStatus)) {
            boolean allLoadsCompleted = savedJob.getLoadAssignments().stream()
                    .allMatch(l -> STATUS_COMPLETED.equalsIgnoreCase(l.getStatus()));

            System.out.println("🔍 AdvanceLoad - All loads completed: " + allLoadsCompleted);
            System.out.println("🔍 Load statuses after advance:");
            savedJob.getLoadAssignments().forEach(l -> {
                System.out.println("   - Load " + l.getLoadNumber() + ": " + l.getStatus());
            });

            // Only send SMS notification if ALL loads are now completed
            if (allLoadsCompleted) {
                System.out.println("🎉 FINAL LOAD COMPLETED via advanceLoad! Triggering SMS notification...");
                sendCompletionSmsNotification(savedJob, loadNumber);
            } else {
                System.out.println("📝 Load completed via advanceLoad, but waiting for other loads. No SMS sent.");
            }
        }

        return savedJob;
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

        // Check if this completion resulted in ALL loads being completed
        boolean allLoadsCompleted = job.getLoadAssignments().stream()
                .allMatch(load -> STATUS_COMPLETED.equalsIgnoreCase(load.getStatus()));

        System.out.println("🔍 CompleteLoad - All loads completed: " + allLoadsCompleted);
        System.out.println("🔍 Load statuses after completion:");
        job.getLoadAssignments().forEach(load -> {
            System.out.println("   - Load " + load.getLoadNumber() + ": " + load.getStatus());
        });

        // Only send SMS notification if ALL loads are now completed
        if (allLoadsCompleted) {
            System.out.println("🎉 FINAL LOAD COMPLETED! Triggering SMS notification...");
            sendCompletionSmsNotification(job, loadNumber);
        } else {
            System.out.println("📝 Load completed, but waiting for other loads. No SMS sent.");
        }

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

            // ONLY send SMS if ALL loads are completed
            if (allLoadsCompleted) {
                System.out.println("🚀 ALL LOADS COMPLETED! Sending SMS notification...");

                Transaction transaction = transactionRepository.findByInvoiceNumber(job.getTransactionId())
                        .orElse(null);

                String serviceType = transaction != null ? transaction.getServiceName() : "laundry";

                System.out.println("📱 SMS Details:");
                System.out.println("   📞 Phone: " + job.getContact());
                System.out.println("   👤 Customer: " + job.getCustomerName());
                System.out.println("   🛠️ Service: " + serviceType);
                System.out.println("   📦 Transaction: " + job.getTransactionId());

                // Send SMS only when ALL loads are done
                smsService.sendLoadCompletedNotification(
                        job.getContact(),
                        job.getCustomerName(),
                        serviceType,
                        job.getTransactionId());

                System.out.println("✅ SMS notification sent for job: " + job.getTransactionId());

            } else {
                System.out.println("⏳ Not all loads completed yet. Skipping SMS.");
                int completedCount = (int) job.getLoadAssignments().stream()
                        .filter(load -> STATUS_COMPLETED.equalsIgnoreCase(load.getStatus()))
                        .count();
                int totalLoads = job.getLoadAssignments().size();
                System.out.println("⏳ Completed: " + completedCount + "/" + totalLoads);

                // Don't send SMS here - wait until all are completed
            }
        } catch (Exception e) {
            System.err.println("❌ Error in sendCompletionSmsNotification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob updateLoadDuration(String transactionId, int loadNumber, double durationMinutes,
            String processedBy) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        load.setDurationMinutes(durationMinutes);
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
        if (job == null) {
            throw new IllegalArgumentException("Job must not be null");
        }
        if (processedBy != null) {
            job.setLaundryProcessedBy(processedBy);
        }
        return laundryJobRepository.save(job);
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public boolean deleteJobById(String id, String processedBy) {
        if (id == null)
            return false;
        if (!laundryJobRepository.existsById(id))
            return false;

        LaundryJob job = id != null ? laundryJobRepository.findById(id).orElse(null) : null;
        if (job != null) {
            if (processedBy != null) {
                job.setLaundryProcessedBy(processedBy);
            }
            laundryJobRepository.save(job);
        }

        if (id != null) {
            laundryJobRepository.deleteById(id);
        }
        return true;
    }

    // ADDED BACK: Dispose job method
    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob disposeJob(String id, String processedBy) {
        if (id == null)
            throw new IllegalArgumentException("ID must not be null");
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
        job.setDisposedDate(getCurrentManilaTime());
        return laundryJobRepository.save(job);
    }

    // ADDED BACK: Get disposed jobs method
    public List<LaundryJob> getDisposedJobs() {
        return laundryJobRepository.findByDisposedTrue();
    }

    @Cacheable(value = "laundryJobs", key = "'allJobs-' + #page + '-' + #size")
    public List<LaundryJobDto> getAllJobs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());
        Page<LaundryJob> jobPage = laundryJobRepository.findAll(pageable);
        List<LaundryJob> jobs = jobPage.getContent();

        List<LaundryJob> nonCompletedJobs = jobs.stream()
                .filter(job -> job.getLoadAssignments() != null)
                .filter(job -> !job.getLoadAssignments().stream()
                        .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
                .collect(Collectors.toList());

        return processJobsToDtos(nonCompletedJobs);
    }

    @Cacheable(value = "laundryJobs", key = "'allJobs'")
    public List<LaundryJobDto> getAllJobs() {
        List<LaundryJob> jobs = laundryJobRepository.findAll();

        List<LaundryJob> nonCompletedJobs = jobs.stream()
                .filter(job -> job.getLoadAssignments() != null)
                .filter(job -> !job.getLoadAssignments().stream()
                        .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
                .collect(Collectors.toList());

        return processJobsToDtos(nonCompletedJobs);
    }

    @Cacheable(value = "completedCount", key = "'allCompleted'")
    public int getAllCompletedCount() {
        List<LaundryJob> allJobs = laundryJobRepository.findAll();

        int count = 0;

        for (LaundryJob job : allJobs) {
            if (job.getLoadAssignments() != null) {
                for (LoadAssignment load : job.getLoadAssignments()) {
                    if (STATUS_COMPLETED.equalsIgnoreCase(load.getStatus())) {
                        count++;
                    }
                }
            }
        }

        System.out.println("📊 ALL Completed loads count: " + count + " (scanned " + allJobs.size() + " total jobs)");
        return count;
    }

    @Cacheable(value = "completedCount", key = "'today'")
    public int getCompletedTodayCount() {
        List<LaundryJob> allJobs = laundryJobRepository.findAll();
        LocalDateTime todayStart = getCurrentManilaTime().toLocalDate().atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);

        int count = 0;

        for (LaundryJob job : allJobs) {
            if (job.getLoadAssignments() != null) {
                for (LoadAssignment load : job.getLoadAssignments()) {
                    if (STATUS_COMPLETED.equalsIgnoreCase(load.getStatus())) {
                        // Check if completed today
                        if (load.getEndTime() != null) {
                            if (!load.getEndTime().isBefore(todayStart) &&
                                    load.getEndTime().isBefore(tomorrowStart)) {
                                count++;
                                System.out.println("✅ Counted today: " + job.getTransactionId() + " load "
                                        + load.getLoadNumber() + " completed at " + load.getEndTime());
                            }
                        } else {
                            count++;
                            System.out.println("✅ Counted today (no endTime): " + job.getTransactionId() + " load "
                                    + load.getLoadNumber());
                        }
                    }
                }
            }
        }

        System.out.println("📊 Completed today count: " + count + " (as of " + getCurrentManilaTime() + ")");
        return count;
    }

    private List<LaundryJobDto> processJobsToDtos(List<LaundryJob> jobs) {
        if (jobs.isEmpty()) {
            return Collections.emptyList();
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

        return result;
    }

    public LaundryJob findSingleJobByTransaction(String transactionId) {
        return laundryJobRepository.findByTransactionId(transactionId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Laundry job not found for transaction: " + transactionId));
    }

    private void releaseMachine(LoadAssignment load) {
        String mid = load.getMachineId();
        if (mid != null) {
            machineRepository.findById(mid).ifPresent(machine -> {
                machine.setStatus(STATUS_AVAILABLE);
                machineRepository.save(machine);
                System.out.println("🔄 Released machine: " + load.getMachineId());
                load.setMachineId(null); // Clear machine reference
            });
        }
    }

    // In LaundryJobService.java - Update getCompletedUnclaimedJobs method
    public List<LaundryJob> getCompletedUnclaimedJobs() {
        List<LaundryJob> allJobs = laundryJobRepository.findAll();

        List<LaundryJob> completedUnclaimed = allJobs.stream()
                .filter(job -> job.getLoadAssignments() != null)
                .filter(job -> job.getLoadAssignments().stream()
                        .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                .filter(job -> !job.isExpired())
                .filter(job -> !job.isDisposed())
                // Add GCash verification filter
                .filter(job -> {
                    try {
                        Transaction transaction = transactionRepository.findByInvoiceNumber(job.getTransactionId())
                                .orElse(null);

                        if (transaction != null && "GCash".equals(transaction.getPaymentMethod())) {
                            return Boolean.TRUE.equals(transaction.getGcashVerified());
                        }
                        return true; // Keep non-GCash transactions
                    } catch (Exception e) {
                        System.err.println(
                                "Error checking transaction for job " + job.getTransactionId() + ": " + e.getMessage());
                        return true;
                    }
                })
                .collect(Collectors.toList());

        System.out.println(
                "✅ Found " + completedUnclaimed.size() + " completed unclaimed jobs (excluding unverified GCash)");

        return completedUnclaimed;
    }

    public List<LaundryJob> getExpiredJobs() {
        return laundryJobRepository.findByExpiredTrueAndDisposedFalse();
    }

    @Scheduled(cron = "0 0 7 * * ?", zone = "Asia/Manila")
    public void checkAndSendDisposalWarnings() {
        LocalDateTime now = getCurrentManilaTime();
        List<LaundryJob> unclaimedJobs = laundryJobRepository.findByPickupStatus("UNCLAIMED");

        System.out.println("⏰ [7:00 AM] Checking disposal warnings for " + unclaimedJobs.size() + " unclaimed jobs");
        System.out.println("📍 Current Manila Time: " + now);

        int warningsSent = 0;

        for (LaundryJob job : unclaimedJobs) {
            if (job.isDisposed() || job.isExpired()) {
                continue;
            }

            if (job.getDueDate() != null) {
                long daysUntilDue = java.time.Duration.between(now, job.getDueDate()).toDays();

                long hoursUntilDue = java.time.Duration.between(now, job.getDueDate()).toHours();

                System.out.println("📅 Job: " + job.getTransactionId() +
                        " | Customer: " + job.getCustomerName() +
                        " | Due: " + job.getDueDate() +
                        " | Days until due: " + daysUntilDue +
                        " | Hours until due: " + hoursUntilDue);

                if (daysUntilDue == 3 || daysUntilDue == 1 || daysUntilDue == 0) {
                    try {
                        smsService.sendDisposalWarningNotification(
                                job.getContact(),
                                job.getCustomerName(),
                                job.getTransactionId(),
                                (int) daysUntilDue);
                        warningsSent++;
                        System.out.println("✅ Sent disposal warning for: " + job.getTransactionId() +
                                " | Days left: " + daysUntilDue);
                    } catch (Exception e) {
                        System.err.println("❌ Failed to send disposal warning for " + job.getTransactionId() +
                                ": " + e.getMessage());
                    }
                }
            }
        }

        System.out.println("📊 Disposal Warning Summary: " + warningsSent + " warnings sent out of "
                + unclaimedJobs.size() + " unclaimed jobs");
    }

    @Scheduled(fixedRate = 3600000)
    public void checkForExpiredJobs() {
        LocalDateTime now = getCurrentManilaTime();
        List<LaundryJob> unclaimedJobs = laundryJobRepository.findByPickupStatus("UNCLAIMED");

        System.out.println("⏰ Hourly expiration check running at: " + now);
        int expiredCount = 0;

        for (LaundryJob job : unclaimedJobs) {
            if (job.isDisposed()) {
                continue;
            }

            if (job.getDueDate() != null && now.isAfter(job.getDueDate()) && !job.isExpired()) {
                job.setExpired(true);
                laundryJobRepository.save(job);
                expiredCount++;
                System.out.println("⏰ Job expired: " + job.getTransactionId() + " - " + job.getCustomerName());

                try {
                    smsService.sendDisposalWarningNotification(
                            job.getContact(),
                            job.getCustomerName(),
                            job.getTransactionId(),
                            0);
                    System.out.println("✅ Sent final expiration notice for: " + job.getTransactionId());
                } catch (Exception e) {
                    System.err.println("❌ Failed to send final expiration notice for " + job.getTransactionId() +
                            ": " + e.getMessage());
                }
            }
        }

        if (expiredCount > 0) {
            System.out.println("📊 Expiration Check Summary: " + expiredCount + " jobs marked as expired");
        }
    }

    public List<LaundryJob> getJobsNeedingDisposalWarnings() {
        LocalDateTime now = getCurrentManilaTime();
        List<LaundryJob> unclaimedJobs = laundryJobRepository.findByPickupStatus("UNCLAIMED");

        return unclaimedJobs.stream()
                .filter(job -> !job.isDisposed() && !job.isExpired())
                .filter(job -> job.getDueDate() != null)
                .filter(job -> {
                    long daysUntilDue = java.time.Duration.between(now, job.getDueDate()).toDays();
                    return daysUntilDue <= 3 && daysUntilDue >= 0;
                })
                .collect(Collectors.toList());
    }

    // Helper method for manual triggering
    public void checkAndSendDisposalWarningsForJob(LaundryJob job) {
        LocalDateTime now = getCurrentManilaTime();

        if (job.isDisposed() || job.isExpired() || job.getDueDate() == null) {
            return;
        }

        long daysUntilDue = java.time.Duration.between(now, job.getDueDate()).toDays();

        System.out.println("📅 Manual Check - Job: " + job.getTransactionId() +
                " | Due: " + job.getDueDate() +
                " | Days until due: " + daysUntilDue);

        // Send warnings at 3 days, 1 day, and on due date
        if (daysUntilDue == 3 || daysUntilDue == 1 || daysUntilDue == 0) {
            try {
                smsService.sendDisposalWarningNotification(
                        job.getContact(),
                        job.getCustomerName(),
                        job.getTransactionId(),
                        (int) daysUntilDue);
                System.out.println("✅ Sent disposal warning for: " + job.getTransactionId() +
                        " | Days left: " + daysUntilDue);
            } catch (Exception e) {
                System.err.println("❌ Failed to send disposal warning for " + job.getTransactionId() +
                        ": " + e.getMessage());
            }
        }
    }

    public Map<String, Object> manuallyTriggerDisposalWarnings() {
        LocalDateTime now = getCurrentManilaTime();
        List<LaundryJob> jobsNeedingWarnings = getJobsNeedingDisposalWarnings();
        int warningsSent = 0;
        int errors = 0;

        System.out.println("🔔 MANUAL TRIGGER: Checking " + jobsNeedingWarnings.size() + " jobs for disposal warnings");
        System.out.println("📍 Current Manila Time: " + now);

        for (LaundryJob job : jobsNeedingWarnings) {
            try {
                checkAndSendDisposalWarningsForJob(job);
                warningsSent++;
            } catch (Exception e) {
                errors++;
                System.err
                        .println("❌ Failed to send warning for job " + job.getTransactionId() + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalJobsChecked", jobsNeedingWarnings.size());
        result.put("warningsSent", warningsSent);
        result.put("errors", errors);
        result.put("timestamp", now.toString());

        System.out.println("📊 Manual Trigger Summary: " + warningsSent + " warnings sent, " + errors + " errors");

        return result;
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

    // In LaundryJobService.java
    public List<LaundryJob> getCompletedUnclaimedJobsWithVerifiedPayments() {
        List<LaundryJob> completedJobs = getCompletedUnclaimedJobs();

        // Filter out unverified GCash transactions
        return completedJobs.stream()
                .filter(job -> {
                    try {
                        Transaction transaction = transactionRepository.findByInvoiceNumber(job.getTransactionId())
                                .orElse(null);

                        if (transaction != null && "GCash".equals(transaction.getPaymentMethod())) {
                            return Boolean.TRUE.equals(transaction.getGcashVerified());
                        }
                        return true; // Keep non-GCash transactions
                    } catch (Exception e) {
                        System.err.println(
                                "Error checking transaction for job " + job.getTransactionId() + ": " + e.getMessage());
                        return true; // In case of error, keep the job
                    }
                })
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "laundryJobs", allEntries = true)
    public LaundryJob releaseMachine(String transactionId, int loadNumber, String processedBy) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        releaseMachine(load);

        job.setLaundryProcessedBy(processedBy);
        return laundryJobRepository.save(job);
    }
}