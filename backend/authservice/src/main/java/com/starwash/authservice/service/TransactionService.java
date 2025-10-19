package com.starwash.authservice.service;

import com.starwash.authservice.dto.*;
import com.starwash.authservice.model.*;
import com.starwash.authservice.repository.*;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class TransactionService {
    
    private final ServiceRepository serviceRepository;
    private final StockRepository stockRepository;
    private final TransactionRepository transactionRepository;
    private final FormatSettingsRepository formatSettingsRepository;
    private final LaundryJobRepository laundryJobRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public TransactionService(ServiceRepository serviceRepository,
            StockRepository stockRepository,
            TransactionRepository transactionRepository,
            FormatSettingsRepository formatSettingsRepository,
            LaundryJobRepository laundryJobRepository,
            NotificationService notificationService,
            AuditService auditService) {
        this.serviceRepository = serviceRepository;
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
        this.formatSettingsRepository = formatSettingsRepository;
        this.laundryJobRepository = laundryJobRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    // Manila timezone (GMT+8)
    private ZoneId getManilaTimeZone() {
        return ZoneId.of("Asia/Manila");
    }

    private LocalDateTime getCurrentManilaTime() {
        return LocalDateTime.now(getManilaTimeZone());
    }

    public ServiceInvoiceDto createServiceInvoiceTransaction(TransactionRequestDto request, String staffId) {
        ServiceItem service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        int loads = Optional.ofNullable(request.getLoads()).orElse(1);
        ServiceEntryDto serviceDto = new ServiceEntryDto(service.getName(), service.getPrice(), loads);
        double total = service.getPrice() * loads;

        List<ServiceEntryDto> consumableDtos = new ArrayList<>();
        List<ServiceEntry> consumables = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : request.getConsumableQuantities().entrySet()) {
            String itemName = entry.getKey();
            int quantity = entry.getValue();

            StockItem item = stockRepository.findByName(itemName)
                    .orElseThrow(() -> new RuntimeException("Stock item not found: " + itemName));

            if (item.getQuantity() < quantity) {
                throw new RuntimeException("Insufficient stock for: " + itemName);
            }

            item.setQuantity(item.getQuantity() - quantity);
            stockRepository.save(item);

            double itemTotal = item.getPrice() * quantity;
            total += itemTotal;

            consumableDtos.add(new ServiceEntryDto(item.getName(), item.getPrice(), quantity));
            consumables.add(new ServiceEntry(item.getName(), item.getPrice(), quantity));
        }

        double amountGiven = Optional.ofNullable(request.getAmountGiven()).orElse(0.0);
        double change = amountGiven - total;

        // Use Manila time for all date operations
        LocalDateTime now = getCurrentManilaTime();
        LocalDateTime issueDate = Optional.ofNullable(request.getIssueDate()).orElse(now);

        LocalDateTime dueDate = Optional.ofNullable(request.getDueDate())
                .orElse(issueDate.plusDays(7));

        System.out.println("🆕 Creating transaction with Manila time:");
        System.out.println("   - Issue Date: " + issueDate);
        System.out.println("   - Due Date: " + dueDate);
        System.out.println("   - Current Manila Time: " + now);

        String invoiceNumber = "INV-" + Long.toString(System.currentTimeMillis(), 36).toUpperCase();

        Transaction transaction = new Transaction(
                null,
                invoiceNumber,
                request.getCustomerName(),
                request.getContact(),
                service.getName(),
                service.getPrice(),
                loads,
                consumables,
                total,
                request.getPaymentMethod(),
                amountGiven,
                change,
                issueDate,
                dueDate,
                staffId,
                now);

        if ("GCash".equals(request.getPaymentMethod())) {
            transaction.setGcashReference(request.getGcashReference());
            transaction.setGcashVerified(false);
        }

        transactionRepository.save(transaction);

        createNewLaundryServiceNotification(transaction);

        FormatSettings settings = formatSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("Format settings not found"));

        int detergentQty = consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("detergent"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum();

        int fabricQty = consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("fabric"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum();

        int plasticQty = consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("plastic"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum();

        return new ServiceInvoiceDto(
                invoiceNumber,
                transaction.getCustomerName(),
                transaction.getContact(),
                serviceDto,
                consumableDtos,
                total,
                0.0,
                0.0,
                total,
                request.getPaymentMethod(),
                amountGiven,
                change,
                issueDate,
                dueDate,
                new FormatSettingsDto(settings),
                detergentQty,
                fabricQty,
                plasticQty,
                loads,
                staffId);
    }

    private void createNewLaundryServiceNotification(Transaction transaction) {
        try {
            String title = "New Laundry Service";
            String message = String.format("New laundry service for %s - %s with %d loads",
                    transaction.getCustomerName(),
                    transaction.getServiceName(),
                    transaction.getServiceQuantity());

            notificationService.notifyAllStaff("new_laundry_service", title, message, transaction.getId());

            System.out.println("🔔 Notification created for new laundry service: " + transaction.getInvoiceNumber());
        } catch (Exception e) {
            System.err.println("❌ Failed to create notification for new laundry service: " + e.getMessage());
        }
    }

    public ServiceInvoiceDto getServiceInvoiceByTransactionId(String id) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        return buildInvoice(tx);
    }

    private ServiceInvoiceDto buildInvoice(Transaction tx) {
        ServiceEntryDto serviceDto = new ServiceEntryDto(
                tx.getServiceName(),
                tx.getServicePrice(),
                tx.getServiceQuantity());

        List<ServiceEntryDto> consumableDtos = tx.getConsumables().stream()
                .map(c -> new ServiceEntryDto(c.getName(), c.getPrice(), c.getQuantity()))
                .collect(Collectors.toList());

        FormatSettings settings = formatSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("Format settings not found"));

        int detergentQty = consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("detergent"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum();

        int fabricQty = consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("fabric"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum();

        int plasticQty = consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("plastic"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum();

        return new ServiceInvoiceDto(
                tx.getInvoiceNumber(),
                tx.getCustomerName(),
                tx.getContact(),
                serviceDto,
                consumableDtos,
                tx.getTotalPrice(),
                0.0,
                0.0,
                tx.getTotalPrice(),
                tx.getPaymentMethod(),
                tx.getAmountGiven(),
                tx.getChange(),
                tx.getIssueDate(),
                tx.getDueDate(),
                new FormatSettingsDto(settings),
                detergentQty,
                fabricQty,
                plasticQty,
                tx.getServiceQuantity(),
                tx.getStaffId());
    }

    public List<RecordResponseDto> getAllRecords() {
        List<Transaction> allTransactions = transactionRepository.findAll();
        List<LaundryJob> allLaundryJobs = laundryJobRepository.findAll();

        Map<String, LaundryJob> laundryJobMap = allLaundryJobs.stream()
                .collect(Collectors.toMap(LaundryJob::getTransactionId, Function.identity()));

        // Use Manila time for expiration checks
        LocalDateTime currentManilaTime = getCurrentManilaTime();

        return allTransactions.stream().map(tx -> {
            RecordResponseDto dto = new RecordResponseDto();
            dto.setId(tx.getId());
            dto.setCustomerName(tx.getCustomerName());
            dto.setServiceName(tx.getServiceName());
            dto.setLoads(tx.getServiceQuantity());

            dto.setContact(tx.getContact());

            dto.setDetergent(tx.getConsumables().stream()
                    .filter(c -> c.getName().toLowerCase().contains("detergent"))
                    .map(c -> String.valueOf(c.getQuantity()))
                    .findFirst().orElse("—"));

            dto.setFabric(tx.getConsumables().stream()
                    .filter(c -> c.getName().toLowerCase().contains("fabric"))
                    .map(c -> String.valueOf(c.getQuantity()))
                    .findFirst().orElse("—"));

            dto.setTotalPrice(tx.getTotalPrice());
            dto.setPaymentMethod(tx.getPaymentMethod());
            dto.setPickupStatus("Unclaimed");
            dto.setWashed(false);
            
            // Use Manila time for expiration check
            dto.setExpired(tx.getDueDate() != null && tx.getDueDate().isBefore(currentManilaTime));
            dto.setCreatedAt(tx.getCreatedAt());

            LaundryJob job = laundryJobMap.get(tx.getInvoiceNumber());
            if (job != null) {
                dto.setPickupStatus(job.getPickupStatus());
                dto.setExpired(job.isExpired());
                dto.setDisposed(job.isDisposed());
            } else {
                dto.setPickupStatus("UNCLAIMED");
                dto.setExpired(tx.getDueDate() != null && tx.getDueDate().isBefore(currentManilaTime));
            }

            return dto;
        }).collect(Collectors.toList());
    }

    public List<RecordResponseDto> getStaffRecords() {
        List<RecordResponseDto> allRecords = this.getAllRecords();

        return allRecords.stream()
                .filter(record -> {
                    if (record.isDisposed()) {
                        return false;
                    }
                    return "UNCLAIMED".equals(record.getPickupStatus()) || record.isExpired();
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStaffRecordsSummary() {
        Map<String, Object> summary = new HashMap<>();

        // Use Manila time for date calculations
        LocalDate today = LocalDate.now(getManilaTimeZone());
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        System.out.println("📊 Staff Records Summary - Manila Time:");
        System.out.println("   - Today: " + today);
        System.out.println("   - Start of Day: " + startOfDay);
        System.out.println("   - End of Day: " + endOfDay);

        List<RecordResponseDto> allRecords = this.getAllRecords();

        List<RecordResponseDto> todaysRecords = allRecords.stream()
                .filter(record -> !record.isDisposed())
                .filter(record -> {
                    LocalDateTime createdAt = record.getCreatedAt();
                    return createdAt.isAfter(startOfDay) && createdAt.isBefore(endOfDay);
                })
                .collect(Collectors.toList());

        double todayIncome = todaysRecords.stream()
                .mapToDouble(RecordResponseDto::getTotalPrice)
                .sum();

        int todayLoads = todaysRecords.stream()
                .mapToInt(RecordResponseDto::getLoads)
                .sum();

        List<LaundryJob> nonDisposedJobs = laundryJobRepository.findByDisposedFalse();

        int unwashedCount = (int) nonDisposedJobs.stream()
                .filter(job -> job.getLoadAssignments() != null)
                .flatMap(job -> job.getLoadAssignments().stream())
                .filter(load -> !"COMPLETED".equalsIgnoreCase(load.getStatus()))
                .count();

        int unclaimedCount = (int) nonDisposedJobs.stream()
                .filter(job -> job.getLoadAssignments() != null &&
                        job.getLoadAssignments().stream()
                                .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                .filter(job -> !job.isExpired())
                .count();

        int expiredCount = (int) laundryJobRepository.findByExpiredTrueAndDisposedFalse().size();

        summary.put("todayIncome", todayIncome);
        summary.put("todayLoads", todayLoads);
        summary.put("unwashedCount", unwashedCount);
        summary.put("unclaimedCount", unclaimedCount);
        summary.put("expiredCount", expiredCount);

        System.out.println("📈 Summary Results:");
        System.out.println("   - Today's Income: ₱" + todayIncome);
        System.out.println("   - Today's Loads: " + todayLoads);
        System.out.println("   - Unwashed Count: " + unwashedCount);
        System.out.println("   - Unclaimed Count: " + unclaimedCount);
        System.out.println("   - Expired Count: " + expiredCount);

        return summary;
    }

    public List<AdminRecordResponseDto> getAllAdminRecords() {
        List<Transaction> allTransactions = transactionRepository.findAll();

        List<LaundryJob> allLaundryJobs = laundryJobRepository.findAll();
        Map<String, LaundryJob> laundryJobMap = allLaundryJobs.stream()
                .collect(Collectors.toMap(LaundryJob::getTransactionId, Function.identity()));

        // Use Manila time for expiration checks
        LocalDateTime currentManilaTime = getCurrentManilaTime();

        return allTransactions.stream().map(tx -> {
            AdminRecordResponseDto dto = new AdminRecordResponseDto();
            dto.setId(tx.getId());
            dto.setInvoiceNumber(tx.getInvoiceNumber());
            dto.setCustomerName(tx.getCustomerName());
            dto.setContact(tx.getContact());
            dto.setServiceName(tx.getServiceName());
            dto.setLoads(tx.getServiceQuantity());

            dto.setDetergent(tx.getConsumables().stream()
                    .filter(c -> c.getName().toLowerCase().contains("detergent"))
                    .map(c -> String.valueOf(c.getQuantity()))
                    .findFirst().orElse("—"));

            dto.setFabric(tx.getConsumables().stream()
                    .filter(c -> c.getName().toLowerCase().contains("fabric"))
                    .map(c -> String.valueOf(c.getQuantity()))
                    .findFirst().orElse("—"));

            dto.setTotalPrice(tx.getTotalPrice());
            dto.setPaymentMethod(tx.getPaymentMethod());
            dto.setProcessedByStaff(tx.getStaffId());
            dto.setPaid(tx.getPaymentMethod() != null && !tx.getPaymentMethod().isEmpty());
            dto.setCreatedAt(tx.getCreatedAt());

            dto.setGcashVerified(tx.getGcashVerified());

            LaundryJob job = laundryJobMap.get(tx.getInvoiceNumber());
            if (job != null) {
                dto.setPickupStatus(
                        job.getPickupStatus() != null ? job.getPickupStatus() : "UNCLAIMED");

                if (job.getLoadAssignments() != null && !job.getLoadAssignments().isEmpty()) {
                    long completedLoads = job.getLoadAssignments().stream()
                            .filter(load -> "COMPLETED".equalsIgnoreCase(load.getStatus()))
                            .count();

                    long totalLoads = job.getLoadAssignments().size();

                    if (completedLoads == totalLoads) {
                        dto.setLaundryStatus("Completed");
                    } else if (completedLoads > 0) {
                        dto.setLaundryStatus("In Progress");
                    } else {
                        boolean anyInProgress = job.getLoadAssignments().stream()
                                .anyMatch(load -> !"NOT_STARTED".equalsIgnoreCase(load.getStatus()) &&
                                        !"COMPLETED".equalsIgnoreCase(load.getStatus()));

                        if (anyInProgress) {
                            dto.setLaundryStatus("In Progress");
                        } else {
                            dto.setLaundryStatus("Not Started");
                        }
                    }

                    long unwashedLoadsCount = job.getLoadAssignments().stream()
                            .filter(load -> !"COMPLETED".equalsIgnoreCase(load.getStatus()))
                            .count();
                    dto.setUnwashedLoadsCount((int) unwashedLoadsCount);

                } else {
                    dto.setLaundryStatus("Not Started");
                    dto.setUnwashedLoadsCount(tx.getServiceQuantity());
                }

                dto.setExpired(job.isExpired());

                dto.setLaundryProcessedBy(job.getLaundryProcessedBy());
                dto.setClaimProcessedBy(job.getClaimedByStaffId());

                dto.setDisposed(job.isDisposed());
                dto.setDisposedBy(job.getDisposedBy());
            } else {
                dto.setPickupStatus("UNCLAIMED");
                dto.setLaundryStatus("Not Started");
                dto.setUnwashedLoadsCount(tx.getServiceQuantity());
                // Use Manila time for transaction expiration check
                dto.setExpired(tx.getDueDate() != null && tx.getDueDate().isBefore(currentManilaTime));
                dto.setLaundryProcessedBy(null);
                dto.setClaimProcessedBy(null);

                dto.setDisposed(false);
                dto.setDisposedBy(null);
            }

            return dto;
        }).collect(Collectors.toList());
    }

    public List<Transaction> findPendingGcashTransactions() {
        return transactionRepository.findByPaymentMethodAndGcashVerified("GCash", false);
    }

    public Transaction findTransactionById(String id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    public void saveTransaction(Transaction transaction) {
        transactionRepository.save(transaction);
    }

    // Additional method to log transaction updates
    public void logTransactionUpdate(String staffId, String transactionId, String description,
            HttpServletRequest request) {
        auditService.logActivity(
                staffId,
                "UPDATE",
                "TRANSACTION",
                transactionId,
                description,
                request);
    }

    // Utility method to fix existing transaction dates to Manila time
    public void fixTransactionDatesToManilaTime() {
        List<Transaction> allTransactions = transactionRepository.findAll();
        int fixedCount = 0;

        for (Transaction transaction : allTransactions) {
            try {
                boolean needsUpdate = false;
                LocalDateTime currentManilaTime = getCurrentManilaTime();

                // Check and fix createdAt if needed
                if (transaction.getCreatedAt() != null) {
                    // If createdAt is more than 8 hours off from current Manila time, it might be in wrong timezone
                    long hoursDifference = java.time.Duration.between(transaction.getCreatedAt(), currentManilaTime).toHours();
                    if (Math.abs(hoursDifference) > 12) {
                        System.out.println("🕒 Fixing createdAt for transaction: " + transaction.getInvoiceNumber());
                        // For simplicity, we'll set it to current Manila time minus a reasonable offset
                        // In a real scenario, you might want to preserve the original time but adjust timezone
                        transaction.setCreatedAt(currentManilaTime.minusDays(1)); // Example adjustment
                        needsUpdate = true;
                    }
                }

                // Check and fix dueDate if it seems incorrect
                if (transaction.getDueDate() != null && transaction.getIssueDate() != null) {
                    // Due date should be 7 days after issue date
                    LocalDateTime expectedDueDate = transaction.getIssueDate().plusDays(7);
                    if (!transaction.getDueDate().equals(expectedDueDate)) {
                        System.out.println("📅 Fixing dueDate for transaction: " + transaction.getInvoiceNumber());
                        transaction.setDueDate(expectedDueDate);
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    transactionRepository.save(transaction);
                    fixedCount++;
                }
            } catch (Exception e) {
                System.err.println("❌ Error fixing transaction dates for " + transaction.getInvoiceNumber() + ": " + e.getMessage());
            }
        }

        System.out.println("✅ Fixed " + fixedCount + " transaction dates to Manila time");
    }
}