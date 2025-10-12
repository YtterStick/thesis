package com.starwash.authservice.controller;

import com.starwash.authservice.dto.TransactionRequestDto;
import com.starwash.authservice.dto.ServiceInvoiceDto;
import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.dto.PendingGcashDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.LaundryJob.LoadAssignment;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.service.TransactionService;
import com.starwash.authservice.service.LaundryJobService;
import com.starwash.authservice.service.AuditService;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.TransactionRepository;
import com.starwash.authservice.security.JwtUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {

    private static final Logger log = LoggerFactory.getLogger(TransactionController.class);

    private final TransactionService transactionService;
    private final LaundryJobService laundryJobService;
    private final LaundryJobRepository laundryJobRepository;
    private final TransactionRepository transactionRepository;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    public TransactionController(TransactionService transactionService,
                                 LaundryJobService laundryJobService,
                                 LaundryJobRepository laundryJobRepository,
                                 TransactionRepository transactionRepository,
                                 JwtUtil jwtUtil,
                                 AuditService auditService) {
        this.transactionService = transactionService;
        this.laundryJobService = laundryJobService;
        this.laundryJobRepository = laundryJobRepository;
        this.transactionRepository = transactionRepository;
        this.jwtUtil = jwtUtil;
        this.auditService = auditService;
    }

    /**
     * Create a transaction and corresponding laundry job
     */
    @PostMapping
    public ResponseEntity<ServiceInvoiceDto> createTransaction(@RequestBody TransactionRequestDto request,
                                                               @RequestHeader("Authorization") String authHeader,
                                                               HttpServletRequest httpRequest) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            // Extract staffId from JWT token
            String token = authHeader.replace("Bearer ", "");
            String staffId = jwtUtil.getUsername(token);
            String staffRole = jwtUtil.getRole(token);
            
            System.out.println("🔄 Starting transaction creation for: " + request.getCustomerName());
            System.out.println("👤 Staff ID: " + staffId);
            System.out.println("🏪 Staff Role: " + staffRole);

            // ✅ Create the service invoice with staffId
            ServiceInvoiceDto invoice = transactionService.createServiceInvoiceTransaction(request, staffId);
            log.info("🧾 Service invoice created | invoiceNumber={} | customer={} | staffId={}",
                    invoice.getInvoiceNumber(),
                    invoice.getCustomerName(),
                    staffId
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

            // ✅ LOG TRANSACTION ACTIVITY TO AUDIT TRAIL
            String transactionDescription = String.format(
                "Created transaction for customer: %s | Invoice: %s | Amount: ₱%.2f | Payment: %s | Loads: %d",
                invoice.getCustomerName(),
                invoice.getInvoiceNumber(),
                invoice.getTotal(),
                invoice.getPaymentMethod(),
                request.getLoads()
            );
            
            // Log the transaction activity with staff role as entity type
            auditService.logActivity(
                staffId,
                "TRANSACTION",
                staffRole, // Use staff role instead of "TRANSACTION"
                invoice.getInvoiceNumber(),
                transactionDescription,
                httpRequest
            );

            System.out.println("✅ Audit log created for transaction: " + invoice.getInvoiceNumber());
            log.info("📝 Transaction logged to audit trail | staff={} | role={} | invoice={}", staffId, staffRole, invoice.getInvoiceNumber());

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
            
            // Convert to DTO - ADD GCASH REFERENCE HERE
            List<PendingGcashDto> dtos = pendingTransactions.stream()
                    .map(tx -> new PendingGcashDto(
                            tx.getId(),
                            tx.getInvoiceNumber(),
                            tx.getCustomerName(),
                            tx.getContact(),
                            tx.getTotalPrice(),
                            tx.getCreatedAt(),
                            tx.getGcashReference()))  // Add GCash reference
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
                                               @RequestHeader("Authorization") String authHeader,
                                               HttpServletRequest httpRequest) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            String token = authHeader.replace("Bearer ", "");
            String staffId = jwtUtil.getUsername(token);
            String staffRole = jwtUtil.getRole(token);
            
            Transaction transaction = transactionService.findTransactionById(id);
            
            if (!"GCash".equals(transaction.getPaymentMethod())) {
                return ResponseEntity.badRequest().body("Transaction is not a GCash payment");
            }
            
            boolean wasVerified = Boolean.TRUE.equals(transaction.getGcashVerified());
            transaction.setGcashVerified(true); 
            transactionService.saveTransaction(transaction);
            
            // Log GCash verification activity
            if (!wasVerified) {
                String description = String.format(
                    "Verified GCash payment | Invoice: %s | Customer: %s | Amount: ₱%.2f | Reference: %s",
                    transaction.getInvoiceNumber(),
                    transaction.getCustomerName(),
                    transaction.getTotalPrice(),
                    transaction.getGcashReference()
                );
                
                auditService.logActivity(
                    staffId,
                    "UPDATE",
                    staffRole, // Use staff role instead of "TRANSACTION"
                    transaction.getInvoiceNumber(),
                    description,
                    httpRequest
                );
                
                log.info("✅ GCash payment verified and logged | transactionId={} | staff={} | role={}", id, staffId, staffRole);
            }
            
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("❌ Failed to verify GCash payment for id={}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Validate due dates for all transactions and laundry jobs
     */
    @GetMapping("/due-date-validation")
    public ResponseEntity<Map<String, Object>> validateDueDates() {
        Map<String, Object> response = new HashMap<>();
        
        List<LaundryJob> jobsWithoutDueDate = laundryJobRepository.findAll().stream()
                .filter(job -> job.getDueDate() == null)
                .collect(Collectors.toList());
        
        List<Transaction> transactionsWithoutDueDate = transactionRepository.findAll().stream()
                .filter(txn -> txn.getDueDate() == null)
                .collect(Collectors.toList());
        
        response.put("jobsWithoutDueDate", jobsWithoutDueDate.size());
        response.put("transactionsWithoutDueDate", transactionsWithoutDueDate.size());
        response.put("message", "Validation completed");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Fix due dates for all transactions and laundry jobs with null dueDate
     */
    @PostMapping("/fix-due-dates")
    public ResponseEntity<Map<String, Object>> fixDueDates() {
        Map<String, Object> response = new HashMap<>();
        
        List<LaundryJob> allJobs = laundryJobRepository.findAll();
        List<Transaction> allTransactions = transactionRepository.findAll();
        
        int fixedJobs = 0;
        int fixedTransactions = 0;
        
        // Check and fix LaundryJobs with null dueDate
        for (LaundryJob job : allJobs) {
            if (job.getDueDate() == null) {
                log.info("Fixing null dueDate for laundry job: {}", job.getTransactionId());
                
                // Try to get dueDate from transaction
                Transaction txn = transactionRepository.findByInvoiceNumber(job.getTransactionId()).orElse(null);
                if (txn != null && txn.getDueDate() != null) {
                    job.setDueDate(txn.getDueDate());
                } else {
                    // Fallback: set to 7 days from creation
                    job.setDueDate(LocalDateTime.now().plusDays(7));
                }
                
                laundryJobRepository.save(job);
                fixedJobs++;
            }
        }
        
        // Check and fix Transactions with null dueDate
        for (Transaction txn : allTransactions) {
            if (txn.getDueDate() == null) {
                log.info("Fixing null dueDate for transaction: {}", txn.getInvoiceNumber());
                
                // Set to 7 days from issue date or creation date
                if (txn.getIssueDate() != null) {
                    txn.setDueDate(txn.getIssueDate().plusDays(7));
                } else {
                    txn.setDueDate(txn.getCreatedAt().plusDays(7));
                }
                
                transactionRepository.save(txn);
                fixedTransactions++;
            }
        }
        
        response.put("fixedJobs", fixedJobs);
        response.put("fixedTransactions", fixedTransactions);
        response.put("message", "Fixed " + fixedJobs + " laundry jobs and " + 
                      fixedTransactions + " transactions with null dueDate");
        
        return ResponseEntity.ok(response);
    }
}