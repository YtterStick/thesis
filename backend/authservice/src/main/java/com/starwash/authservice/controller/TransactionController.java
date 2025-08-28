package com.starwash.authservice.controller;

import com.starwash.authservice.dto.TransactionRequestDto;
import com.starwash.authservice.dto.ServiceInvoiceDto;
import com.starwash.authservice.service.TransactionService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {

    private static final Logger log = LoggerFactory.getLogger(TransactionController.class);

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // ✅ Create transaction and return service invoice
    @PostMapping
    public ResponseEntity<ServiceInvoiceDto> createTransaction(@RequestBody TransactionRequestDto request,
                                                               @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        // 🔒 Defensive guard: reject if frontend sends an ID
        try {
            var idField = request.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            Object idValue = idField.get(request);
            if (idValue != null) {
                log.warn("❌ Rejected transaction with unexpected ID field");
                return ResponseEntity.badRequest().build();
            }
        } catch (NoSuchFieldException | IllegalAccessException ignored) {
            // Safe to ignore if no ID field exists
        }

        try {
            ServiceInvoiceDto invoice = transactionService.createServiceInvoiceTransaction(request);
            log.info("🧾 Service invoice created | invoiceNumber={} | customer={}",
                    invoice.getInvoiceNumber(),
                    invoice.getCustomerName()
            );
            return ResponseEntity.ok(invoice);
        } catch (RuntimeException e) {
            log.error("❌ Transaction creation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    // ✅ Fetch service invoice by transaction ID
    @GetMapping("/{id}/service-invoice")
    public ResponseEntity<ServiceInvoiceDto> getServiceInvoice(@PathVariable String id,
                                                               @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            ServiceInvoiceDto invoice = transactionService.getServiceInvoiceByTransactionId(id);
            return ResponseEntity.ok(invoice);
        } catch (RuntimeException e) {
            log.error("❌ Failed to fetch service invoice for id={}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // ❌ Removed: Lookup by receipt code
    // If you still need QR-based lookup, refactor it to use invoiceNumber instead
}