package com.starwash.authservice.service;

import com.starwash.authservice.dto.*;
import com.starwash.authservice.model.*;
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
    private final InvoiceService invoiceService;

    public TransactionService(ServiceRepository serviceRepository,
                              StockRepository stockRepository,
                              TransactionRepository transactionRepository,
                              InvoiceService invoiceService) {
        this.serviceRepository = serviceRepository;
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
        this.invoiceService = invoiceService;
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
        List<ServiceEntry> consumables = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : request.getConsumableQuantities().entrySet()) {
            String itemName = entry.getKey();
            Integer quantity = entry.getValue();

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

        double amountGiven = request.getAmountGiven() != null ? request.getAmountGiven() : 0.0;
        double change = amountGiven - total;

        LocalDateTime now = LocalDateTime.now();
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
        transaction.setReceiptCode(receiptCode);

        transactionRepository.save(transaction);

        // ✅ Create invoice from transaction
        InvoiceItem invoice = invoiceService.createInvoiceFromTransaction(transaction, request);

        // ✅ Return full response including invoiceNumber
        return new TransactionResponseDto(
                transaction.getId(),
                transaction.getReceiptCode(),
                transaction.getCustomerName(),
                transaction.getContact(),
                serviceDto,
                consumableDtos,
                total,
                transaction.getStatus(),
                amountGiven,
                change,
                transaction.getCreatedAt(),
                invoice.getIssueDate(),
                invoice.getDueDate(),
                invoice.getInvoiceNumber()
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

        InvoiceItem invoice = null;
        try {
            invoice = invoiceService.getInvoiceByTransactionId(transaction.getId());
        } catch (RuntimeException e) {
            // Invoice not found — fallback will apply
        }

        return new TransactionResponseDto(
                transaction.getId(),
                transaction.getReceiptCode(),
                transaction.getCustomerName(),
                transaction.getContact(),
                serviceDto,
                consumableDtos,
                transaction.getTotalPrice(),
                transaction.getStatus(),
                transaction.getAmountGiven(),
                transaction.getChange(),
                transaction.getCreatedAt(),
                invoice != null ? invoice.getIssueDate() : transaction.getCreatedAt(),
                invoice != null ? invoice.getDueDate() : transaction.getCreatedAt().plusDays(7),
                invoice != null ? invoice.getInvoiceNumber() : null
        );
    }
}