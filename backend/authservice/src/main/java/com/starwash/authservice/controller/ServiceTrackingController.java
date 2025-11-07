package com.starwash.authservice.controller;

import com.starwash.authservice.dto.ServiceTrackingDto;
import com.starwash.authservice.dto.ServiceInvoiceDto;
import com.starwash.authservice.dto.ServiceEntryDto;
import com.starwash.authservice.dto.FormatSettingsDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.TransactionRepository;
import com.starwash.authservice.repository.FormatSettingsRepository;
import com.starwash.authservice.model.FormatSettings;
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
    private final FormatSettingsRepository formatSettingsRepository;

    public ServiceTrackingController(TransactionRepository transactionRepository,
                                    LaundryJobRepository laundryJobRepository,
                                    FormatSettingsRepository formatSettingsRepository) {
        this.transactionRepository = transactionRepository;
        this.laundryJobRepository = laundryJobRepository;
        this.formatSettingsRepository = formatSettingsRepository;
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
     * Get receipt data for service tracking (for printing receipts)
     */
    @GetMapping("/{invoiceNumber}/receipt")
    public ResponseEntity<ServiceInvoiceDto> getReceiptForTracking(@PathVariable String invoiceNumber) {
        log.info("📄 Fetching receipt for invoice: {}", invoiceNumber);

        try {
            // Find transaction by invoice number
            Optional<Transaction> transactionOpt = transactionRepository.findByInvoiceNumber(invoiceNumber);
            if (transactionOpt.isEmpty()) {
                log.warn("❌ Transaction not found for invoice: {}", invoiceNumber);
                return ResponseEntity.notFound().build();
            }

            Transaction transaction = transactionOpt.get();
            
            // Convert to ServiceInvoiceDto with proper format settings
            ServiceInvoiceDto invoiceDto = convertToServiceInvoiceDto(transaction);
            
            log.info("✅ Receipt data retrieved for: {}", invoiceNumber);
            return ResponseEntity.ok(invoiceDto);

        } catch (Exception e) {
            log.error("❌ Error fetching receipt for {}: {}", invoiceNumber, e.getMessage());
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
        
        // ✅ FIX: Add amountGiven and change to tracking data
        dto.setAmountGiven(transaction.getAmountGiven());
        dto.setChange(transaction.getChange());

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

    /**
     * Convert Transaction to ServiceInvoiceDto for receipt printing
     * ✅ FIXED: Now properly handles format settings and amount given
     */
    private ServiceInvoiceDto convertToServiceInvoiceDto(Transaction transaction) {
        ServiceInvoiceDto dto = new ServiceInvoiceDto();
        
        // Basic transaction info
        dto.setInvoiceNumber(transaction.getInvoiceNumber());
        dto.setCustomerName(transaction.getCustomerName());
        dto.setContact(transaction.getContact());
        dto.setStaffId(transaction.getStaffId());
        dto.setIssueDate(transaction.getIssueDate());
        dto.setDueDate(transaction.getDueDate());
        dto.setPaymentMethod(transaction.getPaymentMethod());
        
        // ✅ FIX: Use proper total field
        dto.setTotal(transaction.getTotalPrice());
        
        // ✅ FIX: Properly set amountGiven and change from transaction
        dto.setAmountGiven(transaction.getAmountGiven() != null ? transaction.getAmountGiven() : transaction.getTotalPrice());
        dto.setChange(transaction.getChange() != null ? transaction.getChange() : 0.0);
        
        // Service information
        ServiceEntryDto serviceEntry = new ServiceEntryDto();
        serviceEntry.setName(transaction.getServiceName());
        serviceEntry.setPrice(transaction.getServicePrice());
        serviceEntry.setQuantity(transaction.getServiceQuantity());
        dto.setService(serviceEntry);
        
        // Consumables
        if (transaction.getConsumables() != null) {
            List<ServiceEntryDto> consumableEntries = transaction.getConsumables().stream()
                .map(consumable -> {
                    ServiceEntryDto entry = new ServiceEntryDto();
                    entry.setName(consumable.getName());
                    entry.setPrice(consumable.getPrice());
                    entry.setQuantity(consumable.getQuantity());
                    return entry;
                })
                .collect(Collectors.toList());
            dto.setConsumables(consumableEntries);
        }
        
        // ✅ FIX: Get format settings from database instead of hardcoding
        FormatSettingsDto formatSettings = getFormatSettings();
        dto.setFormatSettings(formatSettings);
        
        // Calculate consumable quantities for display
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
            dto.setLoads(transaction.getServiceQuantity());
        }
        
        // Set subtotal, tax, discount
        dto.setSubtotal(transaction.getTotalPrice());
        dto.setTax(0.0); // Adjust based on your tax calculation
        dto.setDiscount(0.0); // Adjust if you have discounts
        
        // Set plasticQty to 0 (adjust if you track plastic usage)
        dto.setPlasticQty(0);
        
        return dto;
    }

    /**
     * ✅ NEW: Get format settings from database
     */
    private FormatSettingsDto getFormatSettings() {
        try {
            Optional<FormatSettings> settingsOpt = formatSettingsRepository.findTopByOrderByIdDesc();
            if (settingsOpt.isPresent()) {
                FormatSettings settings = settingsOpt.get();
                return new FormatSettingsDto(
                    settings.getStoreName(),
                    settings.getAddress(),
                    settings.getPhone(),
                    settings.getFooterNote(),
                    settings.getTrackingUrl()
                );
            }
        } catch (Exception e) {
            log.warn("⚠️ Could not load format settings from database, using defaults");
        }
        
        // Default settings if none found in database
        return new FormatSettingsDto(
            "STARWASH LAUNDRY",
            "53 A Bonifacio Street, Sta Lucia, Novaliches",
            "Tel: 09150475513",
            "Thank you for your business!",
            "https://www.starwashph.com/"
        );
    }
}