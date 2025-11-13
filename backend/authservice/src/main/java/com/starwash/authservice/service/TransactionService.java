package com.starwash.authservice.service;

import com.starwash.authservice.dto.*;
import com.starwash.authservice.model.*;
import com.starwash.authservice.repository.*;
import com.starwash.authservice.security.ManilaTimeUtil;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
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
    private final MongoTemplate mongoTemplate;
    private final MachineService machineService;

    public TransactionService(ServiceRepository serviceRepository,
            StockRepository stockRepository,
            TransactionRepository transactionRepository,
            FormatSettingsRepository formatSettingsRepository,
            LaundryJobRepository laundryJobRepository,
            NotificationService notificationService,
            AuditService auditService,
            MongoTemplate mongoTemplate,
            MachineService machineService) {
        this.serviceRepository = serviceRepository;
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
        this.formatSettingsRepository = formatSettingsRepository;
        this.laundryJobRepository = laundryJobRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.mongoTemplate = mongoTemplate;
        this.machineService = machineService;
    }

    // Use ManilaTimeUtil for all date/time operations
    private LocalDateTime getCurrentManilaTime() {
        return ManilaTimeUtil.now();
    }

    private LocalDate getCurrentManilaDate() {
        return ManilaTimeUtil.now().toLocalDate();
    }

    public ServiceInvoiceDto createServiceInvoiceTransaction(TransactionRequestDto request, String staffId) {
        ServiceItem service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        // AUTO-CALCULATION: Calculate loads based on weight if provided
        int loads;
        int autoPlasticBags = 0;
        String machineInfo = null;
        double machineCapacity = 0;
        
        // Track if plastic should be auto-managed
        boolean shouldAutoManagePlastic = Boolean.TRUE.equals(request.getAutoCalculateLoads());
        
        if (shouldAutoManagePlastic && request.getTotalWeightKg() != null && request.getTotalWeightKg() > 0) {
            try {
                // Use service-aware calculation (detect if it's a dryer service)
                MachineService.LoadCalculationResult calculation = machineService.calculateLoadsForService(
                    request.getTotalWeightKg(), 
                    service.getName()
                );
                loads = calculation.getLoads();
                autoPlasticBags = calculation.getPlasticBags();
                machineInfo = calculation.getMachineInfo();
                machineCapacity = calculation.getMachineCapacity();
                
                System.out.println("🔄 Auto-calculated loads: " + loads + " loads for " + 
                                 request.getTotalWeightKg() + "kg - " + machineInfo);
                
            } catch (Exception e) {
                System.err.println("❌ Auto-calculation failed, using manual loads: " + e.getMessage());
                loads = Optional.ofNullable(request.getLoads()).orElse(1);
                shouldAutoManagePlastic = false; // Disable plastic auto-management if calculation failed
            }
        } else {
            // Fallback to manual input
            loads = Optional.ofNullable(request.getLoads()).orElse(1);
            shouldAutoManagePlastic = false; // Manual mode - don't auto-manage plastic
        }

        ServiceEntryDto serviceDto = new ServiceEntryDto(service.getName(), service.getPrice(), loads);
        double total = service.getPrice() * loads;

        List<ServiceEntryDto> consumableDtos = new ArrayList<>();
        List<ServiceEntry> consumables = new ArrayList<>();

        List<String> insufficientStockItems = new ArrayList<>();

        // AUTO-PLASTIC: Add plastic bags automatically ONLY when auto-calculating
        Map<String, Integer> consumableQuantities = new HashMap<>();
        if (request.getConsumableQuantities() != null) {
            consumableQuantities.putAll(request.getConsumableQuantities());
        }
        
        // Only auto-add plastic when we're in auto-calculation mode
        if (shouldAutoManagePlastic && autoPlasticBags > 0) {
            // Find plastic items in stock
            List<StockItem> plasticItems = stockRepository.findAll().stream()
                    .filter(item -> item.getName().toLowerCase().contains("plastic"))
                    .collect(Collectors.toList());
                
            if (!plasticItems.isEmpty()) {
                StockItem plasticItem = plasticItems.get(0); // Use first plastic item found
                String plasticName = plasticItem.getName();
                
                // Add or update plastic quantity - only if not already manually set
                int currentPlastic = consumableQuantities.getOrDefault(plasticName, 0);
                // Only auto-set if it matches the expected auto value (not manually overridden)
                if (currentPlastic == 0 || currentPlastic == loads) {
                    consumableQuantities.put(plasticName, autoPlasticBags);
                    
                    System.out.println("📦 Auto-added " + autoPlasticBags + " plastic bags for " + loads + " loads");
                } else {
                    System.out.println("📦 Plastic bags manually set to " + currentPlastic + ", not auto-adjusting");
                }
            }
        }

        // Check stock availability for all consumables
        for (Map.Entry<String, Integer> entry : consumableQuantities.entrySet()) {
            String itemName = entry.getKey();
            int quantity = entry.getValue();

            // Skip if quantity is 0
            if (quantity <= 0) continue;

            StockItem item = stockRepository.findByName(itemName)
                    .orElseThrow(() -> new RuntimeException("Stock item not found: " + itemName));

            if (item.getQuantity() < quantity) {
                insufficientStockItems.add(String.format("%s (Requested: %d, Available: %d)",
                        itemName, quantity, item.getQuantity()));

                notificationService.notifyTransactionStockIssue(
                        itemName, quantity, item.getQuantity(), "pending-transaction");
            }
        }

        if (!insufficientStockItems.isEmpty()) {
            String errorMessage = "Insufficient stock for: " + String.join(", ", insufficientStockItems);
            throw new InsufficientStockException(errorMessage, insufficientStockItems);
        }

        // Process consumables and update stock (using updated consumableQuantities)
        for (Map.Entry<String, Integer> entry : consumableQuantities.entrySet()) {
            String itemName = entry.getKey();
            int quantity = entry.getValue();

            // Skip if quantity is 0
            if (quantity <= 0) continue;

            StockItem item = stockRepository.findByName(itemName)
                    .orElseThrow(() -> new RuntimeException("Stock item not found: " + itemName));

            Integer previousQuantity = item.getQuantity();

            item.setQuantity(item.getQuantity() - quantity);
            stockRepository.save(item);

            double itemTotal = item.getPrice() * quantity;
            total += itemTotal;

            consumableDtos.add(new ServiceEntryDto(item.getName(), item.getPrice(), quantity));
            consumables.add(new ServiceEntry(item.getName(), item.getPrice(), quantity));

            notificationService.checkAndNotifyStockLevel(item, previousQuantity);
        }

        double amountGiven = Optional.ofNullable(request.getAmountGiven()).orElse(0.0);
        double change = amountGiven - total;

        // FIXED: Use ManilaTimeUtil for consistent time handling for ALL dates
        LocalDateTime now = ManilaTimeUtil.now();
        
        // Handle issueDate - convert to Manila time if provided, otherwise use current Manila time
        LocalDateTime issueDate;
        if (request.getIssueDate() != null) {
            // Convert provided date to Manila timezone
            issueDate = ManilaTimeUtil.toManilaTime(request.getIssueDate());
        } else {
            issueDate = now;
        }

        // Handle dueDate - convert to Manila time if provided, otherwise calculate from issueDate
        LocalDateTime dueDate;
        if (request.getDueDate() != null) {
            dueDate = ManilaTimeUtil.toManilaTime(request.getDueDate());
        } else {
            dueDate = issueDate.plusDays(7);
        }

        System.out.println("🆕 Creating transaction with Manila time:");
        System.out.println("   - Current Manila Time: " + now);
        System.out.println("   - Issue Date: " + issueDate);
        System.out.println("   - Due Date: " + dueDate);
        System.out.println("   - Created At: " + now); // createdAt uses Manila time
        System.out.println("   - Timezone: " + ManilaTimeUtil.getManilaZone());
        
        // Log auto-calculation info
        if (machineInfo != null) {
            System.out.println("   - Auto-calculation: " + request.getTotalWeightKg() + "kg = " + loads + " loads");
            System.out.println("   - Machine Info: " + machineInfo);
        }

        String invoiceNumber = "INV-" + Long.toString(System.currentTimeMillis(), 36).toUpperCase();

        // Create transaction with ALL dates in Manila time
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
                now); // createdAt set to Manila time

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

        // Include auto-calculation info in response
        ServiceInvoiceDto invoiceDto = new ServiceInvoiceDto(
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
        
        // Add auto-calculation metadata
        if (machineInfo != null) {
            System.out.println("✅ Auto-calculation completed: " + 
                             request.getTotalWeightKg() + "kg → " + loads + " loads - " + machineInfo);
        }

        return invoiceDto;
    }

    public static class InsufficientStockException extends RuntimeException {
        private final List<String> insufficientItems;

        public InsufficientStockException(String message, List<String> insufficientItems) {
            super(message);
            this.insufficientItems = insufficientItems;
        }

        public List<String> getInsufficientItems() {
            return insufficientItems;
        }
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

        LocalDateTime currentManilaTime = getCurrentManilaTime();

        return allTransactions.stream().map(tx -> {
            RecordResponseDto dto = new RecordResponseDto();
            dto.setId(tx.getId());
            dto.setInvoiceNumber(tx.getInvoiceNumber());
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

    // UPDATED: Use ManilaTimeUtil consistently for all date operations
    public Map<String, Object> getStaffRecordsSummary() {
        Map<String, Object> summary = new HashMap<>();

        // Use ManilaTimeUtil for consistent date handling
        LocalDate today = getCurrentManilaDate();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        System.out.println("📊 Staff Records Summary - Manila Time:");
        System.out.println("   - Today: " + today);
        System.out.println("   - Start of Day: " + startOfDay);
        System.out.println("   - End of Day: " + endOfDay);
        System.out.println("   - Current Manila Time: " + getCurrentManilaTime());

        List<RecordResponseDto> allRecords = this.getAllRecords();

        List<RecordResponseDto> todaysRecords = allRecords.stream()
                .filter(record -> !record.isDisposed())
                .filter(record -> {
                    LocalDateTime createdAt = record.getCreatedAt();
                    return createdAt != null && 
                           createdAt.isAfter(startOfDay) && 
                           createdAt.isBefore(endOfDay);
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

        // FIXED: Corrected lambda syntax
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

    // OPTIMIZED VERSION WITH PAGINATION AND CACHING
    @Cacheable(value = "adminRecords", key = "'page-' + #page + '-size-' + #size")
    public List<AdminRecordResponseDto> getAllAdminRecords(int page, int size) {
        long startTime = System.currentTimeMillis();
        
        try {
            System.out.println("🔄 Fetching admin records - Page: " + page + ", Size: " + size);
            
            // Use pagination for transactions
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Transaction> transactionPage = transactionRepository.findAll(pageable);
            List<Transaction> transactions = transactionPage.getContent();
            
            // Get only the laundry jobs needed for these transactions
            List<String> transactionIds = transactions.stream()
                    .map(Transaction::getInvoiceNumber)
                    .collect(Collectors.toList());
                    
            List<LaundryJob> laundryJobs = laundryJobRepository.findByTransactionIdIn(transactionIds);
            Map<String, LaundryJob> laundryJobMap = laundryJobs.stream()
                    .collect(Collectors.toMap(LaundryJob::getTransactionId, Function.identity()));

            LocalDateTime currentManilaTime = getCurrentManilaTime();

            List<AdminRecordResponseDto> result = transactions.stream().map(tx -> {
                AdminRecordResponseDto dto = new AdminRecordResponseDto();
                dto.setId(tx.getId());
                dto.setInvoiceNumber(tx.getInvoiceNumber());
                dto.setCustomerName(tx.getCustomerName());
                dto.setContact(tx.getContact());
                dto.setServiceName(tx.getServiceName());
                dto.setLoads(tx.getServiceQuantity());

                String detergentQty = tx.getConsumables().stream()
                        .filter(c -> c.getName().toLowerCase().contains("detergent"))
                        .map(c -> String.valueOf(c.getQuantity()))
                        .findFirst().orElse("0");

                String fabricQty = tx.getConsumables().stream()
                        .filter(c -> c.getName().toLowerCase().contains("fabric"))
                        .map(c -> String.valueOf(c.getQuantity()))
                        .findFirst().orElse("0");

                dto.setDetergent(detergentQty);
                dto.setFabric(fabricQty);

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
                    dto.setExpired(tx.getDueDate() != null && tx.getDueDate().isBefore(currentManilaTime));
                    dto.setLaundryProcessedBy(null);
                    dto.setClaimProcessedBy(null);
                    dto.setDisposed(false);
                    dto.setDisposedBy(null);
                }

                return dto;
            }).collect(Collectors.toList());
            
            return result;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("🕒 getAllAdminRecords took: " + duration + "ms");
        }
    }

    // Keep old method for backward compatibility
    public List<AdminRecordResponseDto> getAllAdminRecords() {
        return getAllAdminRecords(0, 50); // Default to first 50 records
    }

    @CacheEvict(value = "adminRecords", allEntries = true)
    public void evictAdminRecordsCache() {
        System.out.println("🗑️  Admin records cache evicted");
    }

    // Get summary data for all records (not paginated)
    @Cacheable(value = "adminSummary", key = "'all'")
    public Map<String, Object> getAdminRecordsSummary() {
        long startTime = System.currentTimeMillis();
        
        try {
            System.out.println("📊 Calculating admin records summary...");
            
            List<Transaction> allTransactions = transactionRepository.findAll();
            List<LaundryJob> allLaundryJobs = laundryJobRepository.findAll();

            Map<String, LaundryJob> laundryJobMap = allLaundryJobs.stream()
                    .collect(Collectors.toMap(LaundryJob::getTransactionId, Function.identity()));

            LocalDateTime currentManilaTime = getCurrentManilaTime();

            // Calculate totals from ALL records
            double totalIncome = allTransactions.stream()
                    .mapToDouble(Transaction::getTotalPrice)
                    .sum();

            int totalLoads = allTransactions.stream()
                    .mapToInt(Transaction::getServiceQuantity)
                    .sum();

            int totalFabric = allTransactions.stream()
                    .mapToInt(tx -> tx.getConsumables().stream()
                            .filter(c -> c.getName().toLowerCase().contains("fabric"))
                            .mapToInt(ServiceEntry::getQuantity)
                            .sum())
                    .sum();

            int totalDetergent = allTransactions.stream()
                    .mapToInt(tx -> tx.getConsumables().stream()
                            .filter(c -> c.getName().toLowerCase().contains("detergent"))
                            .mapToInt(ServiceEntry::getQuantity)
                            .sum())
                    .sum();

            long expiredCount = allTransactions.stream()
                    .filter(tx -> {
                        LaundryJob job = laundryJobMap.get(tx.getInvoiceNumber());
                        if (job != null) {
                            return job.isExpired() && !job.isDisposed();
                        }
                        return tx.getDueDate() != null && tx.getDueDate().isBefore(currentManilaTime);
                    })
                    .count();

            long unclaimedCount = allLaundryJobs.stream()
                    .filter(job -> job.getLoadAssignments() != null &&
                            job.getLoadAssignments().stream()
                                    .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
                    .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                    .filter(job -> !job.isExpired())
                    .filter(job -> !job.isDisposed())
                    .count();

            Map<String, Object> summary = new HashMap<>();
            summary.put("totalIncome", totalIncome);
            summary.put("totalLoads", totalLoads);
            summary.put("totalFabric", totalFabric);
            summary.put("totalDetergent", totalDetergent);
            summary.put("expiredCount", expiredCount);
            summary.put("unclaimedCount", unclaimedCount);
            summary.put("totalRecords", allTransactions.size());

            System.out.println("📈 Admin Summary Results:");
            System.out.println("   - Total Income: ₱" + totalIncome);
            System.out.println("   - Total Loads: " + totalLoads);
            System.out.println("   - Total Fabric: " + totalFabric);
            System.out.println("   - Total Detergent: " + totalDetergent);
            System.out.println("   - Expired Count: " + expiredCount);
            System.out.println("   - Unclaimed Count: " + unclaimedCount);
            System.out.println("   - Total Records: " + allTransactions.size());

            return summary;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("🕒 getAdminRecordsSummary took: " + duration + "ms");
        }
    }

    // OPTIMIZED: Get time-filtered summary using aggregation queries
    @Cacheable(value = "adminSummary", key = "'optimized-' + #timeFilter")
    public Map<String, Object> getOptimizedAdminRecordsSummaryByTime(String timeFilter) {
        long startTime = System.currentTimeMillis();
        
        try {
            System.out.println("🚀 OPTIMIZED: Calculating time-filtered admin records summary: " + timeFilter);
            
            // Use aggregation queries instead of loading all records
            LocalDateTime currentManilaTime = getCurrentManilaTime();
            LocalDateTime startDate = calculateStartDate(timeFilter, currentManilaTime);
            
            // Use MongoDB aggregation for faster calculations
            List<Transaction> filteredTransactions;
            if ("all".equals(timeFilter)) {
                // For "all", we can use cached counts or pre-aggregated data
                filteredTransactions = Collections.emptyList(); // We'll use aggregation instead
            } else {
                filteredTransactions = transactionRepository.findByCreatedAtAfter(startDate);
            }
            
            // For simpler implementation, use repository methods with date ranges
            double totalIncome = calculateTotalIncome(timeFilter, startDate);
            int totalLoads = calculateTotalLoads(timeFilter, startDate);
            int totalFabric = calculateTotalFabric(timeFilter, startDate);
            int totalDetergent = calculateTotalDetergent(timeFilter, startDate);
            
            // Use dedicated count queries instead of loading all records
            long expiredCount = laundryJobRepository.countByExpiredTrueAndDisposedFalse();
            long unclaimedCount = laundryJobRepository.countByPickupStatusAndExpiredFalseAndDisposedFalse("UNCLAIMED");
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalIncome", totalIncome);
            summary.put("totalLoads", totalLoads);
            summary.put("totalFabric", totalFabric);
            summary.put("totalDetergent", totalDetergent);
            summary.put("expiredCount", expiredCount);
            summary.put("unclaimedCount", unclaimedCount);
            summary.put("totalRecords", getTotalRecordsCount(timeFilter));
            summary.put("timeFilter", timeFilter);

            System.out.println("🚀 OPTIMIZED Time-Filtered Summary Results (" + timeFilter + "):");
            System.out.println("   - Total Income: ₱" + totalIncome);
            System.out.println("   - Total Loads: " + totalLoads);
            System.out.println("   - Calculation time: " + (System.currentTimeMillis() - startTime) + "ms");

            return summary;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("🚀 OPTIMIZED getAdminRecordsSummaryByTime took: " + duration + "ms");
        }
    }

    // Get time-filtered summary (legacy method - kept for compatibility)
    @Cacheable(value = "adminSummary", key = "#timeFilter")
    public Map<String, Object> getAdminRecordsSummaryByTime(String timeFilter) {
        // Delegate to optimized version
        return getOptimizedAdminRecordsSummaryByTime(timeFilter);
    }

    // Helper methods for optimized calculations
    private double calculateTotalIncome(String timeFilter, LocalDateTime startDate) {
        if ("all".equals(timeFilter)) {
            // Use a cached value or quick aggregation
            Double result = transactionRepository.sumTotalPrice();
            return result != null ? result : 0.0;
        } else {
            Double result = transactionRepository.sumTotalPriceByCreatedAtAfter(startDate);
            return result != null ? result : 0.0;
        }
    }

    private int calculateTotalLoads(String timeFilter, LocalDateTime startDate) {
        if ("all".equals(timeFilter)) {
            Integer result = transactionRepository.sumServiceQuantity();
            return result != null ? result : 0;
        } else {
            Integer result = transactionRepository.sumServiceQuantityByCreatedAtAfter(startDate);
            return result != null ? result : 0;
        }
    }

    private int calculateTotalFabric(String timeFilter, LocalDateTime startDate) {
        // For now, use the existing method - can be optimized later
        List<Transaction> transactions;
        if ("all".equals(timeFilter)) {
            transactions = transactionRepository.findAll();
        } else {
            transactions = transactionRepository.findByCreatedAtAfter(startDate);
        }
        
        return transactions.stream()
                .mapToInt(tx -> tx.getConsumables().stream()
                        .filter(c -> c.getName().toLowerCase().contains("fabric"))
                        .mapToInt(ServiceEntry::getQuantity)
                        .sum())
                .sum();
    }

    private int calculateTotalDetergent(String timeFilter, LocalDateTime startDate) {
        // For now, use the existing method - can be optimized later
        List<Transaction> transactions;
        if ("all".equals(timeFilter)) {
            transactions = transactionRepository.findAll();
        } else {
            transactions = transactionRepository.findByCreatedAtAfter(startDate);
        }
        
        return transactions.stream()
                .mapToInt(tx -> tx.getConsumables().stream()
                        .filter(c -> c.getName().toLowerCase().contains("detergent"))
                        .mapToInt(ServiceEntry::getQuantity)
                        .sum())
                .sum();
    }

    private long getTotalRecordsCount(String timeFilter) {
        if ("all".equals(timeFilter)) {
            return transactionRepository.count();
        } else {
            LocalDateTime currentManilaTime = getCurrentManilaTime();
            LocalDateTime startDate = calculateStartDate(timeFilter, currentManilaTime);
            // This could be optimized with a count query
            return transactionRepository.findByCreatedAtAfter(startDate).size();
        }
    }

    private LocalDateTime calculateStartDate(String timeFilter, LocalDateTime currentTime) {
        switch (timeFilter) {
            case "today":
                return currentTime.toLocalDate().atStartOfDay();
            case "week":
                return currentTime.toLocalDate().atStartOfDay().with(java.time.DayOfWeek.MONDAY);
            case "month":
                return currentTime.toLocalDate().withDayOfMonth(1).atStartOfDay();
            case "year":
                return currentTime.toLocalDate().withDayOfYear(1).atStartOfDay();
            default:
                return currentTime.minusYears(100); // Very old date to get all records
        }
    }

    private Criteria getTimeFilterCriteria(String timeFilter, LocalDateTime currentTime) {
        LocalDateTime startDate = calculateStartDate(timeFilter, currentTime);
        if ("all".equals(timeFilter)) {
            return new Criteria();
        }
        return Criteria.where("createdAt").gte(startDate);
    }

    private List<Transaction> filterTransactionsByTime(List<Transaction> transactions, String timeFilter, LocalDateTime currentTime) {
        if ("all".equals(timeFilter)) {
            return transactions;
        }

        LocalDateTime startDate = calculateStartDate(timeFilter, currentTime);

        return transactions.stream()
                .filter(tx -> tx.getCreatedAt() != null && !tx.getCreatedAt().isBefore(startDate))
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "adminSummary", allEntries = true)
    public void evictAdminSummaryCache() {
        System.out.println("🗑️  Admin summary cache evicted");
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

    // UPDATED: Use ManilaTimeUtil consistently for fixing dates
    public void fixTransactionDatesToManilaTime() {
        List<Transaction> allTransactions = transactionRepository.findAll();
        int fixedCount = 0;

        for (Transaction transaction : allTransactions) {
            try {
                boolean needsUpdate = false;
                LocalDateTime currentManilaTime = getCurrentManilaTime();

                if (transaction.getCreatedAt() != null) {
                    long hoursDifference = java.time.Duration.between(transaction.getCreatedAt(), currentManilaTime)
                            .toHours();
                    if (Math.abs(hoursDifference) > 12) {
                        System.out.println("🕒 Fixing createdAt for transaction: " + transaction.getInvoiceNumber());
                        System.out.println("   - Old date: " + transaction.getCreatedAt());
                        System.out.println("   - New date: " + currentManilaTime.minusDays(1));
                        transaction.setCreatedAt(currentManilaTime.minusDays(1));
                        needsUpdate = true;
                    }
                }

                if (transaction.getDueDate() != null && transaction.getIssueDate() != null) {
                    LocalDateTime expectedDueDate = transaction.getIssueDate().plusDays(7);
                    if (!transaction.getDueDate().equals(expectedDueDate)) {
                        System.out.println("📅 Fixing dueDate for transaction: " + transaction.getInvoiceNumber());
                        System.out.println("   - Old due date: " + transaction.getDueDate());
                        System.out.println("   - New due date: " + expectedDueDate);
                        transaction.setDueDate(expectedDueDate);
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    transactionRepository.save(transaction);
                    fixedCount++;
                }
            } catch (Exception e) {
                System.err.println("❌ Error fixing transaction dates for " + transaction.getInvoiceNumber() + ": "
                        + e.getMessage());
            }
        }

        System.out.println("✅ Fixed " + fixedCount + " transaction dates to Manila time");
    }
    
    // Get total count for pagination
    public long getTotalAdminRecordsCount() {
        return transactionRepository.count();
    }

    // OPTIMIZED: Time-filtered records with better performance
    @Cacheable(value = "adminRecords", key = "'page-' + #page + '-size-' + #size + '-filter-' + #timeFilter")
    public List<AdminRecordResponseDto> getAllAdminRecordsByTime(int page, int size, String timeFilter) {
        long startTime = System.currentTimeMillis();
        
        try {
            System.out.println("🔄 OPTIMIZED: Fetching time-filtered admin records - Page: " + page + ", Size: " + size + ", Filter: " + timeFilter);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            List<Transaction> transactions;
            
            // Use database-level filtering instead of Java filtering
            if ("all".equals(timeFilter)) {
                transactions = transactionRepository.findAll(pageable).getContent();
            } else {
                LocalDateTime startDate = calculateStartDate(timeFilter, getCurrentManilaTime());
                transactions = transactionRepository.findByCreatedAtAfter(startDate, pageable);
            }
            
            // Get only the laundry jobs needed for these transactions
            List<String> transactionIds = transactions.stream()
                    .map(Transaction::getInvoiceNumber)
                    .collect(Collectors.toList());
                    
            List<LaundryJob> laundryJobs = laundryJobRepository.findByTransactionIdIn(transactionIds);
            Map<String, LaundryJob> laundryJobMap = laundryJobs.stream()
                    .collect(Collectors.toMap(LaundryJob::getTransactionId, Function.identity()));

            LocalDateTime currentManilaTime = getCurrentManilaTime();

            List<AdminRecordResponseDto> result = transactions.stream().map(tx -> {
                AdminRecordResponseDto dto = new AdminRecordResponseDto();
                dto.setId(tx.getId());
                dto.setInvoiceNumber(tx.getInvoiceNumber());
                dto.setCustomerName(tx.getCustomerName());
                dto.setContact(tx.getContact());
                dto.setServiceName(tx.getServiceName());
                dto.setLoads(tx.getServiceQuantity());

                String detergentQty = tx.getConsumables().stream()
                        .filter(c -> c.getName().toLowerCase().contains("detergent"))
                        .map(c -> String.valueOf(c.getQuantity()))
                        .findFirst().orElse("0");

                String fabricQty = tx.getConsumables().stream()
                        .filter(c -> c.getName().toLowerCase().contains("fabric"))
                        .map(c -> String.valueOf(c.getQuantity()))
                        .findFirst().orElse("0");

                dto.setDetergent(detergentQty);
                dto.setFabric(fabricQty);

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
                    dto.setExpired(tx.getDueDate() != null && tx.getDueDate().isBefore(currentManilaTime));
                    dto.setLaundryProcessedBy(null);
                    dto.setClaimProcessedBy(null);
                    dto.setDisposed(false);
                    dto.setDisposedBy(null);
                }

                return dto;
            }).collect(Collectors.toList());
            
            System.out.println("✅ OPTIMIZED: Loaded " + result.size() + " time-filtered records");
            return result;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("🕒 OPTIMIZED getAllAdminRecordsByTime took: " + duration + "ms");
        }
    }

    // Get count for time-filtered records
    @Cacheable(value = "adminRecordsCount", key = "'filter-' + #timeFilter")
    public long getTotalAdminRecordsCountByTime(String timeFilter) {
        try {
            System.out.println("📊 Counting time-filtered records: " + timeFilter);
            
            List<Transaction> allTransactions = transactionRepository.findAll();
            LocalDateTime currentManilaTime = getCurrentManilaTime();

            List<Transaction> filteredTransactions = filterTransactionsByTime(allTransactions, timeFilter, currentManilaTime);
            long count = filteredTransactions.size();
            
            System.out.println("✅ Time-filtered count (" + timeFilter + "): " + count);
            return count;
        } catch (Exception e) {
            System.err.println("❌ Error counting time-filtered records: " + e.getMessage());
            return transactionRepository.count(); // Fallback to total count
        }
    }
}