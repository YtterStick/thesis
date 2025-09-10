package com.starwash.authservice.controller;

import com.starwash.authservice.dto.TransactionRequestDto;
import com.starwash.authservice.dto.ServiceInvoiceDto;
import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.model.LaundryJob.LoadAssignment;
import com.starwash.authservice.service.TransactionService;
import com.starwash.authservice.service.LaundryJobService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

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
}