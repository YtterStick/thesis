package com.starwash.authservice.controller;

import com.starwash.authservice.dto.ServiceTrackingDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/track")
@CrossOrigin(origins = "http://localhost:3000")
public class ServiceTrackingController {

    private static final Logger log = LoggerFactory.getLogger(ServiceTrackingController.class);

    private final TransactionRepository transactionRepository;
    private final LaundryJobRepository laundryJobRepository;

    public ServiceTrackingController(TransactionRepository transactionRepository,
                                    LaundryJobRepository laundryJobRepository) {
        this.transactionRepository = transactionRepository;
        this.laundryJobRepository = laundryJobRepository;
    }

    /**
     * Get service tracking information by invoice number (for QR codes)
     * This is the main endpoint that your QR codes point to
     */
    @GetMapping("/{invoiceNumber}")
    public ResponseEntity<ServiceTrackingDto> getServiceTracking(@PathVariable String invoiceNumber) {
        log.info("🔍 Fetching service tracking for invoice: {}", invoiceNumber);

        try {
            // Find transaction by invoice number
            Optional<Transaction> transactionOpt = transactionRepository.findByInvoiceNumber(invoiceNumber);
            if (transactionOpt.isEmpty()) {
                log.warn("❌ Transaction not found for invoice: {}", invoiceNumber);
                return ResponseEntity.notFound().build();
            }

            Transaction transaction = transactionOpt.get();

            // Find laundry job by transaction ID (invoice number)
            List<LaundryJob> laundryJobs = laundryJobRepository.findByTransactionId(invoiceNumber);
            if (laundryJobs.isEmpty()) {
                log.warn("❌ Laundry job not found for transaction: {}", invoiceNumber);
                // Return transaction data even if laundry job not found yet
                return ResponseEntity.ok(buildServiceTrackingDto(transaction, null));
            }

            LaundryJob laundryJob = laundryJobs.get(0); // Get first job (should be only one per transaction)

            ServiceTrackingDto trackingDto = buildServiceTrackingDto(transaction, laundryJob);
            log.info("✅ Service tracking data retrieved for: {} - {}", invoiceNumber, transaction.getCustomerName());

            return ResponseEntity.ok(trackingDto);

        } catch (Exception e) {
            log.error("❌ Error fetching service tracking for {}: {}", invoiceNumber, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Search service tracking by customer name (for the search functionality)
     */
    @GetMapping("/search")
    public ResponseEntity<List<ServiceTrackingDto>> searchByCustomerName(@RequestParam String customerName) {
        log.info("🔍 Searching service tracking for customer: {}", customerName);

        try {
            // Find transactions by customer name
            List<Transaction> transactions = transactionRepository.findByCustomerNameIgnoreCase(customerName);
            
            if (transactions.isEmpty()) {
                log.info("ℹ️ No transactions found for customer: {}", customerName);
                return ResponseEntity.ok(List.of());
            }

            List<ServiceTrackingDto> trackingDtos = transactions.stream()
                    .map(transaction -> {
                        List<LaundryJob> jobs = laundryJobRepository.findByTransactionId(transaction.getInvoiceNumber());
                        LaundryJob job = jobs.isEmpty() ? null : jobs.get(0);
                        return buildServiceTrackingDto(transaction, job);
                    })
                    .collect(Collectors.toList());

            log.info("✅ Found {} transactions for customer: {}", trackingDtos.size(), customerName);
            return ResponseEntity.ok(trackingDtos);

        } catch (Exception e) {
            log.error("❌ Error searching service tracking for {}: {}", customerName, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get recent transactions (for recent searches functionality)
     */
    @GetMapping("/recent")
    public ResponseEntity<List<ServiceTrackingDto>> getRecentTransactions(@RequestParam(defaultValue = "5") int limit) {
        log.info("🔍 Fetching {} recent transactions", limit);

        try {
            // Get all transactions and sort by creation date (most recent first)
            List<Transaction> allTransactions = transactionRepository.findAll();
            
            List<ServiceTrackingDto> recentTransactions = allTransactions.stream()
                    .sorted((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()))
                    .limit(limit)
                    .map(transaction -> {
                        List<LaundryJob> jobs = laundryJobRepository.findByTransactionId(transaction.getInvoiceNumber());
                        LaundryJob job = jobs.isEmpty() ? null : jobs.get(0);
                        return buildServiceTrackingDto(transaction, job);
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(recentTransactions);

        } catch (Exception e) {
            log.error("❌ Error fetching recent transactions: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Build ServiceTrackingDto from Transaction and LaundryJob
     */
    private ServiceTrackingDto buildServiceTrackingDto(Transaction transaction, LaundryJob laundryJob) {
        ServiceTrackingDto dto = new ServiceTrackingDto();
        
        // Transaction data (customer information first)
        dto.setInvoiceNumber(transaction.getInvoiceNumber());
        dto.setCustomerName(transaction.getCustomerName());
        dto.setContact(transaction.getContact());
        dto.setServiceName(transaction.getServiceName());
        dto.setServicePrice(transaction.getServicePrice());
        dto.setLoads(transaction.getServiceQuantity());
        dto.setTotalPrice(transaction.getTotalPrice());
        dto.setPaymentMethod(transaction.getPaymentMethod());
        dto.setIssueDate(transaction.getIssueDate());
        dto.setDueDate(transaction.getDueDate());
        dto.setCreatedAt(transaction.getCreatedAt());
        dto.setStaffId(transaction.getStaffId());

        // Calculate consumable quantities
        if (transaction.getConsumables() != null) {
            int detergentQty = transaction.getConsumables().stream()
                    .filter(c -> c.getName().toLowerCase().contains("detergent"))
                    .mapToInt(c -> c.getQuantity())
                    .sum();

            int fabricQty = transaction.getConsumables().stream()
                    .filter(c -> c.getName().toLowerCase().contains("fabric"))
                    .mapToInt(c -> c.getQuantity())
                    .sum();

            dto.setDetergentQty(detergentQty);
            dto.setFabricQty(fabricQty);
        }

        // Laundry job data (progress information)
        if (laundryJob != null) {
            dto.setLaundryJobId(laundryJob.getId());
            dto.setLoadAssignments(laundryJob.getLoadAssignments());
            dto.setPickupStatus(laundryJob.getPickupStatus());
            dto.setCurrentStep(laundryJob.getCurrentStep());
            dto.setStatusFlow(laundryJob.getStatusFlow());
            dto.setLaundryProcessedBy(laundryJob.getLaundryProcessedBy());
            dto.setExpired(laundryJob.isExpired());
            dto.setDisposed(laundryJob.isDisposed());
        } else {
            // Default values if no laundry job exists yet
            dto.setPickupStatus("UNCLAIMED");
            dto.setCurrentStep(0);
            dto.setExpired(false);
            dto.setDisposed(false);
        }

        return dto;
    }
}