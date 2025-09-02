package com.starwash.authservice.controller;

import com.starwash.authservice.dto.TransactionRequestDto;
import com.starwash.authservice.dto.ServiceInvoiceDto;
import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.service.TransactionService;
import com.starwash.authservice.service.LaundryJobService;

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
    private final LaundryJobService laundryJobService;

    public TransactionController(TransactionService transactionService,
                                 LaundryJobService laundryJobService) {
        this.transactionService = transactionService;
        this.laundryJobService = laundryJobService;
    }

    @PostMapping
    public ResponseEntity<ServiceInvoiceDto> createTransaction(@RequestBody TransactionRequestDto request,
                                                               @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            var idField = request.getClass().getDeclaredField("id");
            idField.setAccessible(true);
            Object idValue = idField.get(request);
            if (idValue != null) {
                log.warn("❌ Rejected transaction with unexpected ID field");
                return ResponseEntity.badRequest().build();
            }
        } catch (NoSuchFieldException | IllegalAccessException ignored) {}

        try {
            ServiceInvoiceDto invoice = transactionService.createServiceInvoiceTransaction(request);
            log.info("🧾 Service invoice created | invoiceNumber={} | customer={}",
                    invoice.getInvoiceNumber(),
                    invoice.getCustomerName()
            );

            // ✅ Create corresponding LaundryJob
            LaundryJobDto jobDto = new LaundryJobDto();
            jobDto.setTransactionId(invoice.getInvoiceNumber());
            jobDto.setCustomerName(invoice.getCustomerName());
            jobDto.setLoads(invoice.getLoads());
            jobDto.setDetergentQty(request.getDetergentQty());
            jobDto.setFabricQty(request.getFabricQty());
            jobDto.setMachineId(null);
            jobDto.setStatusFlow(request.getStatusFlow());
            jobDto.setCurrentStep(0);

            laundryJobService.createJob(jobDto);
            log.info("🧺 Laundry job created for transaction {}", invoice.getInvoiceNumber());

            return ResponseEntity.ok(invoice);
        } catch (RuntimeException e) {
            log.error("❌ Transaction creation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

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
}