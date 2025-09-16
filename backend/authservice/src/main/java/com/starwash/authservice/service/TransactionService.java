package com.starwash.authservice.service;

import com.starwash.authservice.dto.*;
import com.starwash.authservice.model.*;
import com.starwash.authservice.repository.*;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TransactionService {

        private final ServiceRepository serviceRepository;
        private final StockRepository stockRepository;
        private final TransactionRepository transactionRepository;
        private final FormatSettingsRepository formatSettingsRepository;
        private final LaundryJobRepository laundryJobRepository;

        public TransactionService(ServiceRepository serviceRepository,
                        StockRepository stockRepository,
                        TransactionRepository transactionRepository,
                        FormatSettingsRepository formatSettingsRepository,
                        LaundryJobRepository laundryJobRepository) {
                this.serviceRepository = serviceRepository;
                this.stockRepository = stockRepository;
                this.transactionRepository = transactionRepository;
                this.formatSettingsRepository = formatSettingsRepository;
                this.laundryJobRepository = laundryJobRepository;
        }

        public ServiceInvoiceDto createServiceInvoiceTransaction(TransactionRequestDto request) {
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

                LocalDateTime now = LocalDateTime.now();
                LocalDateTime issueDate = Optional.ofNullable(request.getIssueDate()).orElse(now);
                LocalDateTime dueDate = Optional.ofNullable(request.getDueDate()).orElse(issueDate.plusDays(7));

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
                                request.getStaffId(),
                                now);

                // Set GCash verification status
                if ("GCash".equals(request.getPaymentMethod())) {
                        transaction.setGcashVerified(false);
                }

                transactionRepository.save(transaction);

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
                                issueDate,
                                dueDate,
                                new FormatSettingsDto(settings),
                                detergentQty,
                                fabricQty,
                                plasticQty,
                                loads);
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
                                tx.getIssueDate(),
                                tx.getDueDate(),
                                new FormatSettingsDto(settings),
                                detergentQty,
                                fabricQty,
                                plasticQty,
                                tx.getServiceQuantity());
        }

        public List<RecordResponseDto> getAllRecords() {
                List<Transaction> allTransactions = transactionRepository.findAll();
                List<LaundryJob> allLaundryJobs = laundryJobRepository.findAll();

                Map<String, LaundryJob> laundryJobMap = allLaundryJobs.stream()
                                .collect(Collectors.toMap(LaundryJob::getTransactionId, Function.identity()));

                return allTransactions.stream().map(tx -> {
                        RecordResponseDto dto = new RecordResponseDto();
                        dto.setId(tx.getId());
                        dto.setCustomerName(tx.getCustomerName());
                        dto.setServiceName(tx.getServiceName());
                        dto.setLoads(tx.getServiceQuantity());

                        // ✅ Add contact
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
                        dto.setExpired(tx.getDueDate().isBefore(LocalDateTime.now()));
                        dto.setCreatedAt(tx.getCreatedAt());

                        LaundryJob job = laundryJobMap.get(tx.getInvoiceNumber());
                        if (job != null) {
                                dto.setPickupStatus(job.getPickupStatus());
                                dto.setExpired(job.isExpired());
                                dto.setDisposed(job.isDisposed());
                        } else {
                                dto.setPickupStatus("UNCLAIMED");
                                dto.setExpired(tx.getDueDate() != null &&
                                                tx.getDueDate().isBefore(LocalDateTime.now()));
                        }

                        return dto;
                }).collect(Collectors.toList());
        }

        public List<RecordResponseDto> getStaffRecords() {
                List<RecordResponseDto> allRecords = this.getAllRecords();

                return allRecords.stream()
                                .filter(record -> {
                                        // Exclude disposed records
                                        if (record.isDisposed()) {
                                                return false;
                                        }
                                        // Include only unclaimed or expired records
                                        return "UNCLAIMED".equals(record.getPickupStatus()) || record.isExpired();
                                })
                                .collect(Collectors.toList());
        }

        public Map<String, Object> getStaffRecordsSummary() {
                Map<String, Object> summary = new HashMap<>();

                // Get today's date for filtering
                LocalDate today = LocalDate.now();
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

                // Get all transactions (not filtered)
                List<RecordResponseDto> allRecords = this.getAllRecords();

                // Filter today's records for income and loads
                List<RecordResponseDto> todaysRecords = allRecords.stream()
                                .filter(record -> {
                                        LocalDateTime createdAt = record.getCreatedAt();
                                        return createdAt.isAfter(startOfDay) && createdAt.isBefore(endOfDay);
                                })
                                .collect(Collectors.toList());

                // Calculate today's income and loads
                double todayIncome = todaysRecords.stream()
                                .mapToDouble(RecordResponseDto::getTotalPrice)
                                .sum();

                int todayLoads = todaysRecords.stream()
                                .mapToInt(RecordResponseDto::getLoads)
                                .sum();

                // Get all laundry jobs for accurate unwashed and unclaimed counts
                List<LaundryJob> allJobs = laundryJobRepository.findAll();

                // Calculate unwashed count (jobs that are not completed)
                int unwashedCount = (int) allJobs.stream()
                                .filter(job -> job.getLoadAssignments() != null)
                                .flatMap(job -> job.getLoadAssignments().stream())
                                .filter(load -> !"COMPLETED".equalsIgnoreCase(load.getStatus()))
                                .count();

                // Calculate unclaimed count (completed but unclaimed jobs)
                int unclaimedCount = (int) allJobs.stream()
                                .filter(job -> job.getLoadAssignments() != null &&
                                                job.getLoadAssignments().stream()
                                                                .allMatch(load -> "COMPLETED"
                                                                                .equalsIgnoreCase(load.getStatus())))
                                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                                .filter(job -> !job.isExpired()) // Exclude expired jobs
                                .count();

                // Calculate expired count
                int expiredCount = (int) allJobs.stream()
                                .filter(LaundryJob::isExpired)
                                .filter(job -> !job.isDisposed()) // Exclude disposed jobs
                                .count();

                summary.put("todayIncome", todayIncome);
                summary.put("todayLoads", todayLoads);
                summary.put("unwashedCount", unwashedCount);
                summary.put("unclaimedCount", unclaimedCount);
                summary.put("expiredCount", expiredCount);

                return summary;
        }

        public List<AdminRecordResponseDto> getAllAdminRecords() {
                List<Transaction> allTransactions = transactionRepository.findAll();

                // Get all laundry jobs in a single query
                List<LaundryJob> allLaundryJobs = laundryJobRepository.findAll();
                Map<String, LaundryJob> laundryJobMap = allLaundryJobs.stream()
                                .collect(Collectors.toMap(LaundryJob::getTransactionId, Function.identity()));

                return allTransactions.stream().map(tx -> {
                        AdminRecordResponseDto dto = new AdminRecordResponseDto();
                        dto.setId(tx.getId());
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

                        // Set GCash verification status
                        dto.setGcashVerified(tx.getGcashVerified());

                        // Get laundry job data
                        LaundryJob job = laundryJobMap.get(tx.getInvoiceNumber());
                        if (job != null) {
                                // Set pickup status
                                dto.setPickupStatus(
                                                job.getPickupStatus() != null ? job.getPickupStatus() : "UNCLAIMED");

                                // Set laundry status based on load assignments
                                if (job.getLoadAssignments() != null && !job.getLoadAssignments().isEmpty()) {
                                        boolean allCompleted = job.getLoadAssignments().stream()
                                                        .allMatch(load -> "COMPLETED"
                                                                        .equalsIgnoreCase(load.getStatus()));

                                        boolean anyInProgress = job.getLoadAssignments().stream()
                                                        .anyMatch(load -> !"NOT_STARTED"
                                                                        .equalsIgnoreCase(load.getStatus()) &&
                                                                        !"COMPLETED".equalsIgnoreCase(
                                                                                        load.getStatus()));

                                        if (allCompleted) {
                                                dto.setLaundryStatus("Completed");
                                        } else if (anyInProgress) {
                                                dto.setLaundryStatus("In Progress");
                                        } else {
                                                dto.setLaundryStatus("Not Started");
                                        }
                                } else {
                                        dto.setLaundryStatus("Not Started");
                                }

                                // Set expired status
                                dto.setExpired(job.isExpired());

                                // Set the two new processed by fields
                                dto.setLaundryProcessedBy(job.getLaundryProcessedBy());
                                dto.setClaimProcessedBy(job.getClaimedByStaffId());
                        } else {
                                // Default values if no laundry job exists
                                dto.setPickupStatus("UNCLAIMED");
                                dto.setLaundryStatus("Not Started");
                                dto.setExpired(tx.getDueDate() != null
                                                && tx.getDueDate().isBefore(LocalDateTime.now()));
                                // Set default values for the new fields
                                dto.setLaundryProcessedBy(null);
                                dto.setClaimProcessedBy(null);
                        }

                        return dto;
                }).collect(Collectors.toList());
        }

        // NEW METHODS FOR PENDING GCASH PAYMENTS

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
}