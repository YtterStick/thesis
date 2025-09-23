package com.starwash.authservice.service;

import com.starwash.authservice.dto.FormatSettingsDto;
import com.starwash.authservice.dto.ServiceClaimReceiptDto;
import com.starwash.authservice.model.FormatSettings;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.FormatSettingsRepository;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ClaimingService {

    private final LaundryJobRepository laundryJobRepository;
    private final FormatSettingsRepository formatSettingsRepository;
    private final TransactionRepository transactionRepository;

    public ClaimingService(LaundryJobRepository laundryJobRepository,
                          FormatSettingsRepository formatSettingsRepository,
                          TransactionRepository transactionRepository) {
        this.laundryJobRepository = laundryJobRepository;
        this.formatSettingsRepository = formatSettingsRepository;
        this.transactionRepository = transactionRepository;
    }

    public ServiceClaimReceiptDto claimLaundry(String transactionId, String staffName) {
        LaundryJob job = laundryJobRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Laundry job not found: " + transactionId));

        if ("CLAIMED".equals(job.getPickupStatus())) {
            throw new RuntimeException("Job already claimed");
        }

        if (job.isExpired()) {
            throw new RuntimeException("Cannot claim expired job");
        }

        // Check if this is a GCash transaction and verify it's verified
        Transaction transaction = transactionRepository.findByInvoiceNumber(transactionId)
                .orElse(null);
        
        if (transaction != null && "GCash".equals(transaction.getPaymentMethod())) {
            if (!Boolean.TRUE.equals(transaction.getGcashVerified())) {
                throw new RuntimeException("Cannot claim laundry with unverified GCash payment");
            }
        }

        String claimReceiptNumber = "CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        job.setPickupStatus("CLAIMED");
        job.setClaimDate(LocalDateTime.now());
        job.setClaimReceiptNumber(claimReceiptNumber);
        job.setClaimedByStaffId(staffName);
        laundryJobRepository.save(job);

        FormatSettings settings = formatSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("Format settings not found"));

        // Calculate completion date from load assignments (latest endTime)
        LocalDateTime completionDate = job.getLoadAssignments().stream()
                .filter(load -> load.getEndTime() != null)
                .map(LaundryJob.LoadAssignment::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(job.getClaimDate()); // Fallback to claim date if no endTime found

        // Get actual number of loads (not just completed ones)
        int totalLoads = job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0;

        return new ServiceClaimReceiptDto(
                claimReceiptNumber,
                job.getTransactionId(), // This is the invoice number
                job.getCustomerName(),
                job.getContact(),
                job.getServiceType(),
                totalLoads, // Use actual number of loads
                completionDate, // When laundry was actually completed
                job.getClaimDate(), // When it was claimed (different from completion)
                staffName, // Staff who processed the claim
                new FormatSettingsDto(settings));
    }

    public ServiceClaimReceiptDto getClaimReceipt(String transactionId) {
        LaundryJob job = laundryJobRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Laundry job not found: " + transactionId));

        if (!"CLAIMED".equals(job.getPickupStatus())) {
            throw new RuntimeException("Laundry job not claimed yet");
        }

        FormatSettings settings = formatSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("Format settings not found"));

        // Calculate completion date from load assignments (latest endTime)
        LocalDateTime completionDate = job.getLoadAssignments().stream()
                .filter(load -> load.getEndTime() != null)
                .map(LaundryJob.LoadAssignment::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(job.getClaimDate());

        // Get actual number of loads
        int totalLoads = job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0;

        return new ServiceClaimReceiptDto(
                job.getClaimReceiptNumber(),
                job.getTransactionId(),
                job.getCustomerName(),
                job.getContact(),
                job.getServiceType(),
                totalLoads,
                completionDate,
                job.getClaimDate(),
                job.getClaimedByStaffId() != null ? job.getClaimedByStaffId() : "Staff",
                new FormatSettingsDto(settings));
    }

    public List<LaundryJob> getClaimedJobs() {
        return laundryJobRepository.findByPickupStatus("CLAIMED");
    }
}