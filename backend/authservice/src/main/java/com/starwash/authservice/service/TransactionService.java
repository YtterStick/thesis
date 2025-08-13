package com.starwash.authservice.service;

import com.starwash.authservice.dto.*;
import com.starwash.authservice.model.ServiceItem;
import com.starwash.authservice.model.ServiceEntry;
import com.starwash.authservice.model.StockItem;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.ServiceRepository;
import com.starwash.authservice.repository.StockRepository;
import com.starwash.authservice.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final ServiceRepository serviceRepository;
    private final StockRepository stockRepository;
    private final TransactionRepository transactionRepository;

    public TransactionService(ServiceRepository serviceRepository,
                              StockRepository stockRepository,
                              TransactionRepository transactionRepository) {
        this.serviceRepository = serviceRepository;
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
    }

    public TransactionResponseDto createTransaction(TransactionRequestDto request) {
        ServiceItem service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        int loads = request.getLoads() != null ? request.getLoads() : 1;

        ServiceEntryDto serviceDto = new ServiceEntryDto(
                service.getName(),
                service.getPrice(),
                loads
        );

        double total = service.getPrice() * loads;

        List<ServiceEntryDto> consumableDtos = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : request.getConsumableQuantities().entrySet()) {
            String itemName = entry.getKey();
            Integer quantity = entry.getValue();

            StockItem item = stockRepository.findByName(itemName)
                    .orElseThrow(() -> new RuntimeException("Stock item not found: " + itemName));

            double itemTotal = item.getPrice() * quantity;
            total += itemTotal;

            consumableDtos.add(new ServiceEntryDto(item.getName(), item.getPrice(), quantity));
        }

        double amountGiven = request.getAmountGiven() != null ? request.getAmountGiven() : 0.0;
        double change = amountGiven - total;

        List<ServiceEntry> consumables = consumableDtos.stream()
                .map(dto -> new ServiceEntry(dto.getName(), dto.getPrice(), dto.getQuantity()))
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();

        // ✅ Generate printable receipt code
        String receiptCode = "R-" + Long.toString(System.currentTimeMillis(), 36);

        Transaction transaction = new Transaction(
                request.getCustomerName(),
                request.getContact(),
                service.getName(),
                service.getPrice(),
                loads,
                consumables,
                total,
                request.getStatus(),
                amountGiven,
                change,
                now
        );
        transaction.setReceiptCode(receiptCode); // ✅ assign code

        transactionRepository.save(transaction);

        return new TransactionResponseDto(
                transaction.getId(),
                transaction.getReceiptCode(), // ✅ include in response
                transaction.getCustomerName(),
                transaction.getContact(),
                serviceDto,
                consumableDtos,
                total,
                transaction.getStatus(),
                amountGiven,
                change,
                transaction.getCreatedAt(),
                transaction.getCreatedAt(),
                transaction.getCreatedAt().plusDays(7)
        );
    }

    public TransactionResponseDto getTransactionById(String id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        ServiceEntryDto serviceDto = new ServiceEntryDto(
                transaction.getServiceName(),
                transaction.getServicePrice(),
                transaction.getServiceQuantity()
        );

        List<ServiceEntryDto> consumableDtos = transaction.getConsumables().stream()
                .map(entry -> new ServiceEntryDto(entry.getName(), entry.getPrice(), entry.getQuantity()))
                .collect(Collectors.toList());

        return new TransactionResponseDto(
                transaction.getId(),
                transaction.getReceiptCode(), // ✅ include in response
                transaction.getCustomerName(),
                transaction.getContact(),
                serviceDto,
                consumableDtos,
                transaction.getTotalPrice(),
                transaction.getStatus(),
                transaction.getAmountGiven(),
                transaction.getChange(),
                transaction.getCreatedAt(),
                transaction.getCreatedAt(),
                transaction.getCreatedAt().plusDays(7)
        );
    }
}