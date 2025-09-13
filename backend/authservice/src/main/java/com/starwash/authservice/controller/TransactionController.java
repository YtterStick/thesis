package com.starwash.authservice.controller;

import com.starwash.authservice.dto.TransactionRequestDto;
import com.starwash.authservice.dto.ServiceInvoiceDto;
import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.dto.PendingGcashDto;
import com.starwash.authservice.model.LaundryJob.LoadAssignment;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.service.TransactionService;
import com.starwash.authservice.service.LaundryJobService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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

    /**
     * Create a transaction and corresponding laundry job
     */
    @PostMapping
    public ResponseEntity<ServiceInvoiceDto> createTransaction(@RequestBody TransactionRequestDto request,
                                                               @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            // ✅ Create the service invoice
            ServiceInvoiceDto invoice = transactionService.createServiceInvoiceTransaction(request);
            log.info("🧾 Service invoice created | invoiceNumber={} | customer={}",
                    invoice.getInvoiceNumber(),
                    invoice.getCustomerName()
            );

            // ✅ Build per-load assignments
            List<LoadAssignment> loadAssignments = new ArrayList<>();
            for (int i = 1; i <= request.getLoads(); i++) {
                LoadAssignment load = new LoadAssignment();
                load.setLoadNumber(i);
                load.setStatus("UNWASHED");
                loadAssignments.add(load);
            }

            // ✅ Create a corresponding LaundryJobDto
            LaundryJobDto jobDto = new LaundryJobDto();
            jobDto.setTransactionId(invoice.getInvoiceNumber());
            jobDto.setCustomerName(invoice.getCustomerName());
            jobDto.setContact(invoice.getContact()); // ✅ Add contact
            jobDto.setDetergentQty(request.getDetergentQty());
            jobDto.setFabricQty(request.getFabricQty());
            jobDto.setLoadAssignments(loadAssignments);
            jobDto.setStatusFlow(request.getStatusFlow());
            jobDto.setCurrentStep(0);
            jobDto.setServiceType(invoice.getService().getName()); // ✅ CRITICAL: Set service type from invoice

            // ✅ Save the job
            laundryJobService.createJob(jobDto);
            log.info("🧺 Laundry job initialized for transaction {}", invoice.getInvoiceNumber());

            return ResponseEntity.ok(invoice);
        } catch (RuntimeException e) {
            log.error("❌ Transaction creation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Get service invoice by transaction ID
     */
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

    /**
     * Get pending GCash transactions
     */
    @GetMapping("/pending-gcash")
    public ResponseEntity<List<PendingGcashDto>> getPendingGcashTransactions(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<Transaction> pendingTransactions = transactionService.findPendingGcashTransactions();
            
            // Convert to DTO
            List<PendingGcashDto> dtos = pendingTransactions.stream()
                    .map(tx -> new PendingGcashDto(
                            tx.getId(),
                            tx.getInvoiceNumber(),
                            tx.getCustomerName(),
                            tx.getContact(),
                            tx.getTotalPrice(),
                            tx.getCreatedAt()))
                    .collect(Collectors.toList());
                    
            return ResponseEntity.ok(dtos);
        } catch (RuntimeException e) {
            log.error("❌ Failed to fetch pending GCash transactions: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Verify a GCash payment
     */
    @PostMapping("/{id}/verify-gcash")
    public ResponseEntity<?> verifyGcashPayment(@PathVariable String id, 
                                               @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            Transaction transaction = transactionService.findTransactionById(id);
            
            if (!"GCash".equals(transaction.getPaymentMethod())) {
                return ResponseEntity.badRequest().body("Transaction is not a GCash payment");
            }
            
            transaction.setGcashVerified(true);
            transactionService.saveTransaction(transaction);
            
            log.info("✅ GCash payment verified | transactionId={}", id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("❌ Failed to verify GCash payment for id={}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}