package com.starwash.authservice.service;

import com.starwash.authservice.dto.FormatSettingsDto;
import com.starwash.authservice.dto.ServiceClaimReceiptDto;
import com.starwash.authservice.model.FormatSettings;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.repository.FormatSettingsRepository;
import com.starwash.authservice.repository.LaundryJobRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ClaimingService {

    private final LaundryJobRepository laundryJobRepository;
    private final FormatSettingsRepository formatSettingsRepository;

    public ClaimingService(LaundryJobRepository laundryJobRepository,
                           FormatSettingsRepository formatSettingsRepository) {
        this.laundryJobRepository = laundryJobRepository;
        this.formatSettingsRepository = formatSettingsRepository;
    }

    /**
     * Mark job as claimed and generate receipt DTO
     */
    public ServiceClaimReceiptDto claimLaundry(String transactionId, String staffName) {
        LaundryJob job = laundryJobRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Laundry job not found: " + transactionId));

        if ("CLAIMED".equals(job.getPickupStatus())) {
            throw new RuntimeException("Job already claimed");
        }

        // Generate claim receipt number
        String claimReceiptNumber = "CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Update job
        job.setPickupStatus("CLAIMED");
        job.setClaimDate(LocalDateTime.now());
        job.setClaimReceiptNumber(claimReceiptNumber);
        job.setClaimedByStaffId(staffName);
        laundryJobRepository.save(job);

        // Load latest format settings
        FormatSettings settings = formatSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("Format settings not found"));

        // Build receipt DTO
        return new ServiceClaimReceiptDto(
                claimReceiptNumber,
                job.getTransactionId(),
                job.getCustomerName(),
                job.getContact(),
                job.getServiceType(),
                job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0,
                job.getClaimDate(),
                staffName,
                new FormatSettingsDto(settings)
        );
    }

    /**
     * Get receipt for already claimed job
     */
    public ServiceClaimReceiptDto getClaimReceipt(String transactionId) {
        LaundryJob job = laundryJobRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Laundry job not found: " + transactionId));

        if (!"CLAIMED".equals(job.getPickupStatus())) {
            throw new RuntimeException("Laundry job not claimed yet");
        }

        FormatSettings settings = formatSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("Format settings not found"));

        return new ServiceClaimReceiptDto(
                job.getClaimReceiptNumber(),
                job.getTransactionId(),
                job.getCustomerName(),
                job.getContact(),
                job.getServiceType(),
                job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0,
                job.getClaimDate(),
                job.getClaimedByStaffId() != null ? job.getClaimedByStaffId() : "Staff",
                new FormatSettingsDto(settings)
        );
    }

    /**
     * Get all claimed laundry jobs
     */
    public List<LaundryJob> getClaimedJobs() {
        return laundryJobRepository.findByPickupStatus("CLAIMED");
    }
}
