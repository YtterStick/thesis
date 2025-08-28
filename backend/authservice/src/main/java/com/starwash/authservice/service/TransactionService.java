package com.starwash.authservice.service;

import com.starwash.authservice.dto.*;
import com.starwash.authservice.model.*;
import com.starwash.authservice.repository.*;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final ServiceRepository serviceRepository;
    private final StockRepository stockRepository;
    private final TransactionRepository transactionRepository;
    private final FormatSettingsRepository formatSettingsRepository;

    public TransactionService(ServiceRepository serviceRepository,
                              StockRepository stockRepository,
                              TransactionRepository transactionRepository,
                              FormatSettingsRepository formatSettingsRepository) {
        this.serviceRepository = serviceRepository;
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
        this.formatSettingsRepository = formatSettingsRepository;
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
                null, // ✅ Let MongoDB assign the ID
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
                now
        );

        transactionRepository.save(transaction);

        FormatSettings settings = formatSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("Format settings not found"));

        ServiceInvoiceDto dto = new ServiceInvoiceDto(
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
                new FormatSettingsDto(settings)
        );

        // 🆕 Populate new fields
        dto.setDetergentQty(consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("detergent"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum());

        dto.setFabricQty(consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("fabric"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum());

        dto.setPlasticQty(consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("plastic"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum());

        dto.setLoads(loads);

        return dto;
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
                tx.getServiceQuantity()
        );

        List<ServiceEntryDto> consumableDtos = tx.getConsumables().stream()
                .map(c -> new ServiceEntryDto(c.getName(), c.getPrice(), c.getQuantity()))
                .collect(Collectors.toList());

        FormatSettings settings = formatSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("Format settings not found"));

        ServiceInvoiceDto dto = new ServiceInvoiceDto(
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
                new FormatSettingsDto(settings)
        );

        // 🆕 Populate new fields
        dto.setDetergentQty(consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("detergent"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum());

        dto.setFabricQty(consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("fabric"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum());

        dto.setPlasticQty(consumableDtos.stream()
                .filter(c -> c.getName().toLowerCase().contains("plastic"))
                .mapToInt(ServiceEntryDto::getQuantity)
                .sum());

        dto.setLoads(tx.getServiceQuantity());

        return dto;
    }

    public List<RecordResponseDto> getAllRecords() {
        List<Transaction> allTransactions = transactionRepository.findAll();

        return allTransactions.stream().map(tx -> {
            RecordResponseDto dto = new RecordResponseDto();
            dto.setId(tx.getId());
            dto.setCustomerName(tx.getCustomerName());
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
            dto.setPickupStatus("Unclaimed");
            dto.setWashed(false);
            dto.setExpired(tx.getDueDate().isBefore(LocalDateTime.now()));
            dto.setCreatedAt(tx.getCreatedAt());

            return dto;
        }).collect(Collectors.toList());
    }
}