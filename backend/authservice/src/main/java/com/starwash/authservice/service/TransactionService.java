package com.starwash.authservice.service;

import com.starwash.authservice.dto.*;
import com.starwash.authservice.model.*;
import com.starwash.authservice.repository.*;

import org.springframework.stereotype.Service;

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

            return dto;
        }).collect(Collectors.toList());
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

            // Get laundry job data
            LaundryJob job = laundryJobMap.get(tx.getInvoiceNumber());
            if (job != null) {
                // Set pickup status
                dto.setPickupStatus(job.getPickupStatus() != null ? job.getPickupStatus() : "UNCLAIMED");
                
                // Set laundry status based on load assignments
                if (job.getLoadAssignments() != null && !job.getLoadAssignments().isEmpty()) {
                    boolean allCompleted = job.getLoadAssignments().stream()
                            .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus()));
                    
                    boolean anyInProgress = job.getLoadAssignments().stream()
                            .anyMatch(load -> !"NOT_STARTED".equalsIgnoreCase(load.getStatus()) && 
                                              !"COMPLETED".equalsIgnoreCase(load.getStatus()));
                    
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
            } else {
                // Default values if no laundry job exists
                dto.setPickupStatus("UNCLAIMED");
                dto.setLaundryStatus("Not Started");
                dto.setExpired(tx.getDueDate() != null && tx.getDueDate().isBefore(LocalDateTime.now()));
            }

            return dto;
        }).collect(Collectors.toList());
    }
}