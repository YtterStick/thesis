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
        
        if (load == null) return false;
        
        String requiredType = getRequiredMachineType(load.getStatus(), job.getServiceType());
        return requiredType == null || requiredType.equalsIgnoreCase(machine.getType());
    }

    private String getRequiredMachineType(String status, String serviceType) {
        if (status == null) return null;
        
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
                    } else if (serviceType.toLowerCase().contains("dry") && !serviceType.toLowerCase().contains("wash")) {
                        return "DRYER";
                    }
                }
                return null;
            default:
                return null;
        }
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

        // Enhanced validation: Ensure correct machine type
        MachineItem machine = machineRepository.findById(load.getMachineId())
                .orElseThrow(() -> new RuntimeException("Machine not found"));

        Transaction txn = transactionRepository.findByInvoiceNumber(transactionId).orElse(null);
        String serviceType = (txn != null ? txn.getServiceName() : job.getServiceType());
        String nextStatus = determineNextStatus(serviceType, load);

        // Validate machine type matches the required step
        String requiredMachineType = getRequiredMachineType(nextStatus, serviceType);
        if (requiredMachineType != null && !requiredMachineType.equalsIgnoreCase(machine.getType())) {
            throw new RuntimeException("Invalid machine type for this step. Expected " + 
                requiredMachineType + " but got " + machine.getType());
        }

        int defaultDuration;
        switch (nextStatus) {
            case STATUS_WASHING -> defaultDuration = 35;
            case STATUS_DRYING -> defaultDuration = 40;
            default -> defaultDuration = 20;
        }

        int finalDuration = (durationMinutes != null && durationMinutes > 0) ? durationMinutes : defaultDuration;

        LocalDateTime now = getCurrentManilaTime();
        load.setStatus(nextStatus);
        load.setStartTime(now);
        load.setDurationMinutes(finalDuration);
        load.setEndTime(now.plusMinutes(finalDuration));

        machine.setStatus(STATUS_IN_USE);
        machineRepository.save(machine);

        job.setLaundryProcessedBy(processedBy);
        LaundryJob saved = laundryJobRepository.save(job);

        System.out.println("⏰ TIMING DEBUG - startLoad:");
        System.out.println("   Transaction: " + transactionId);
        System.out.println("   Load: " + loadNumber);
        System.out.println("   Status: " + nextStatus);
        System.out.println("   Machine Type: " + machine.getType());
        System.out.println("   Duration: " + finalDuration + " minutes");
        System.out.println("   Start Time (Manila): " + now);
        System.out.println("   End Time (Manila): " + load.getEndTime());

        scheduler.schedule(() -> {
            System.out.println("🏃‍♂️ Executing scheduled task for " + transactionId + " load " + loadNumber);
            autoAdvanceAfterStepEnds(serviceType, transactionId, loadNumber);
        }, finalDuration, TimeUnit.MINUTES);

        return saved;
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
        
        LocalDateTime now = getCurrentManilaTime();
        load.setStartTime(now);

        int duration = (load.getDurationMinutes() != null && load.getDurationMinutes() > 0)
                ? load.getDurationMinutes()
                : 40;

        load.setEndTime(now.plusMinutes(duration));

        // Ensure we have a dryer machine assigned
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
            // Validate existing machine is a dryer
            MachineItem machine = machineRepository.findById(load.getMachineId())
                    .orElseThrow(() -> new RuntimeException("Machine not found"));
            
            if (!"DRYER".equalsIgnoreCase(machine.getType())) {
                throw new RuntimeException("Assigned machine is not a dryer");
            }
            
            machine.setStatus(STATUS_IN_USE);
            machineRepository.save(machine);
        }

        job.setLaundryProcessedBy(processedBy);
        LaundryJob saved = laundryJobRepository.save(job);

        System.out.println("🔥 DRY AGAIN DEBUG:");
        System.out.println("   Transaction: " + transactionId);
        System.out.println("   Load: " + loadNumber);
        System.out.println("   Duration: " + duration + " minutes");
        System.out.println("   Machine: " + load.getMachineId());

        scheduler.schedule(() -> {
            System.out.println("🏃‍♂️ Executing scheduled drying task for " + transactionId + " load " + loadNumber);
            autoAdvanceAfterStepEnds("dry", transactionId, loadNumber);
        }, duration, TimeUnit.MINUTES);

        return saved;
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

    // FIXED: Only release machine when moving from washing to washed or drying to folding/completed
    // Do NOT release machine for DRIED status
    if ((STATUS_WASHING.equals(previousStatus) && STATUS_WASHED.equals(newStatus)) ||
        (STATUS_DRYING.equals(previousStatus) && (STATUS_FOLDING.equals(newStatus) || STATUS_COMPLETED.equals(newStatus)))) {
        releaseMachine(load);
    }

    sendStatusChangeNotifications(job, load, previousStatus, newStatus);

    job.setLaundryProcessedBy(processedBy);
    return laundryJobRepository.save(job);
}
    @CacheEvict(value = "laundryJobs", allEntries = true)
    private synchronized void autoAdvanceAfterStepEnds(String serviceType, String transactionId, int loadNumber) {
        try {
            System.out.println("🔄 autoAdvanceAfterStepEnds called for " + transactionId + " load " + loadNumber);
            
            LaundryJob job = findSingleJobByTransaction(transactionId);
            Transaction txn = transactionRepository.findByInvoiceNumber(transactionId).orElse(null);
            String svc = (txn != null ? txn.getServiceName() : serviceType);

            LoadAssignment load = job.getLoadAssignments().stream()
                    .filter(l -> l.getLoadNumber() == loadNumber)
                    .findFirst()
                    .orElse(null);

            if (load == null) {
                System.out.println("❌ Load not found for " + transactionId + " load " + loadNumber);
                return;
            }

            String previousStatus = load.getStatus();
            System.out.println("📊 Current status: " + previousStatus + " for " + transactionId + " load " + loadNumber);
            
            if (STATUS_COMPLETED.equals(previousStatus) || STATUS_FOLDING.equals(previousStatus)) {
                System.out.println("⏩ Skipping auto-advance - already in final state: " + previousStatus);
                return;
            }

            LocalDateTime currentManilaTime = getCurrentManilaTime();
            boolean shouldAdvance = false;
            
            if (load.getEndTime() != null) {
                boolean isPastEndTime = currentManilaTime.isAfter(load.getEndTime());
                System.out.println("⏰ Time Check - Current: " + currentManilaTime + 
                                 ", EndTime: " + load.getEndTime() + 
                                 ", IsPastEndTime: " + isPastEndTime);
                
                if (isPastEndTime) {
                    shouldAdvance = true;
                }
            } else {
                System.out.println("⚠️  No endTime set for " + transactionId + " load " + loadNumber);
            }

            if (shouldAdvance) {
                switch (previousStatus.toUpperCase()) {
                    case STATUS_WASHING:
                        load.setStatus(STATUS_WASHED);
                        releaseMachine(load);
                        System.out.println("🕒 Auto-advanced from WASHING to WASHED for " + transactionId + " load " + loadNumber);
                        break;
                    case STATUS_DRYING:
                        load.setStatus(STATUS_DRIED);
                        releaseMachine(load);
                        System.out.println("🕒 Auto-advanced from DRYING to DRIED for " + transactionId + " load " + loadNumber);
                        break;
                    default:
                        System.out.println("❓ No auto-advance logic for status: " + previousStatus);
                        return;
                }

                sendStatusChangeNotifications(job, load, previousStatus, load.getStatus());
                laundryJobRepository.save(job);

                boolean allCompleted = job.getLoadAssignments().stream()
                        .allMatch(l -> STATUS_COMPLETED.equalsIgnoreCase(l.getStatus()));

                if (allCompleted) {
                    sendCompletionSmsNotification(job, loadNumber);
                }
            } else {
                System.out.println("⏰ Not yet time to auto-advance for " + transactionId + " load " + loadNumber);
                
                if (load.getEndTime() != null) {
                    long secondsUntilEnd = java.time.Duration.between(currentManilaTime, load.getEndTime()).getSeconds();
                    if (secondsUntilEnd > 0 && secondsUntilEnd <= 300) {
                        System.out.println("🔄 Rescheduling check in " + (secondsUntilEnd + 10) + " seconds");
                        scheduler.schedule(() -> autoAdvanceAfterStepEnds(serviceType, transactionId, loadNumber),
                                secondsUntilEnd + 10, TimeUnit.SECONDS);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error in autoAdvanceAfterStepEnds for " + transactionId + " load " + loadNumber + ": " + e.getMessage());
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

    // ADDED BACK: Dispose job method
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
                                System.out.println("✅ Counted today: " + job.getTransactionId() + " load " + load.getLoadNumber() + " completed at " + load.getEndTime());
                            }
                        } else {
                            count++;
                            System.out.println("✅ Counted today (no endTime): " + job.getTransactionId() + " load " + load.getLoadNumber());
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
        if (load.getMachineId() != null) {
            machineRepository.findById(load.getMachineId()).ifPresent(machine -> {
                machine.setStatus(STATUS_AVAILABLE);
                machineRepository.save(machine);
                System.out.println("🔄 Released machine: " + load.getMachineId());
                load.setMachineId(null); // Clear machine reference
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
                            (int) daysUntilDue
                        );
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
        
        System.out.println("📊 Disposal Warning Summary: " + warningsSent + " warnings sent out of " + unclaimedJobs.size() + " unclaimed jobs");
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
                        0 
                    );
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
                    (int) daysUntilDue
                );
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
                System.err.println("❌ Failed to send warning for job " + job.getTransactionId() + ": " + e.getMessage());
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

    public void checkAndFixTimerStates(String transactionId) {
        try {
            LaundryJob job = findSingleJobByTransaction(transactionId);
            LocalDateTime now = getCurrentManilaTime();
            
            for (LoadAssignment load : job.getLoadAssignments()) {
                if ((STATUS_WASHING.equals(load.getStatus()) || STATUS_DRYING.equals(load.getStatus())) 
                    && load.getEndTime() != null && now.isAfter(load.getEndTime())) {
                    
                    System.out.println("🔧 Fixing stuck timer for " + transactionId + " load " + load.getLoadNumber());
                    autoAdvanceAfterStepEnds(job.getServiceType(), transactionId, load.getLoadNumber());
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error checking timer states: " + e.getMessage());
        }
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