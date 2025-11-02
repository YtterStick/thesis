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
import java.time.ZoneId;
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

    private ZoneId getManilaTimeZone() {
        return ZoneId.of("Asia/Manila");
    }

    private LocalDateTime getCurrentManilaTime() {
        return LocalDateTime.now(getManilaTimeZone());
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

        Transaction transaction = transactionRepository.findByInvoiceNumber(transactionId)
                .orElse(null);
        
        if (transaction != null && "GCash".equals(transaction.getPaymentMethod())) {
            if (!Boolean.TRUE.equals(transaction.getGcashVerified())) {
                throw new RuntimeException("Cannot claim laundry with unverified GCash payment");
            }
        }

        String claimReceiptNumber = "CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        LocalDateTime claimDateManila = getCurrentManilaTime();
        
        job.setPickupStatus("CLAIMED");
        job.setClaimDate(claimDateManila);
        job.setClaimReceiptNumber(claimReceiptNumber);
        job.setClaimedByStaffId(staffName);
        laundryJobRepository.save(job);

        System.out.println("✅ Laundry claimed - Transaction: " + transactionId + 
                         " | Customer: " + job.getCustomerName() + 
                         " | Claim Date (Manila): " + claimDateManila +
                         " | Staff: " + staffName);

        FormatSettings settings = formatSettingsRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("Format settings not found"));

        LocalDateTime completionDate = job.getLoadAssignments().stream()
                .filter(load -> load.getEndTime() != null)
                .map(LaundryJob.LoadAssignment::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(claimDateManila);

        int totalLoads = job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0;

        System.out.println("📅 Completion Date Details for " + transactionId + ":");
        System.out.println("   - Latest End Time: " + completionDate);
        System.out.println("   - Total Loads: " + totalLoads);
        System.out.println("   - Claim Date: " + claimDateManila);

        return new ServiceClaimReceiptDto(
                claimReceiptNumber,
                job.getTransactionId(),
                job.getCustomerName(),
                job.getContact(),
                job.getServiceType(),
                totalLoads,
                completionDate, 
                claimDateManila,
                staffName,
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

        LocalDateTime completionDate = job.getLoadAssignments().stream()
                .filter(load -> load.getEndTime() != null)
                .map(LaundryJob.LoadAssignment::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(job.getClaimDate());

        int totalLoads = job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0;

        System.out.println("📄 Claim receipt retrieved - Transaction: " + transactionId + 
                         " | Customer: " + job.getCustomerName() + 
                         " | Completion Date: " + completionDate);

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

    public void checkJobExpirationStatus(String transactionId) {
        try {
            LaundryJob job = laundryJobRepository.findById(transactionId)
                    .orElseThrow(() -> new RuntimeException("Laundry job not found: " + transactionId));

            LocalDateTime currentManilaTime = getCurrentManilaTime();
            LocalDateTime dueDate = job.getDueDate();

            System.out.println("⏰ Expiration Check for " + transactionId + ":");
            System.out.println("   - Current Manila Time: " + currentManilaTime);
            System.out.println("   - Due Date: " + dueDate);
            System.out.println("   - Is Expired: " + job.isExpired());
            System.out.println("   - Pickup Status: " + job.getPickupStatus());

            if (dueDate != null) {
                boolean isPastDue = currentManilaTime.isAfter(dueDate);
                System.out.println("   - Is Past Due: " + isPastDue);
                
                if (isPastDue && !job.isExpired()) {
                    System.out.println("⚠️  Job is past due but not marked as expired!");
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error checking expiration status for " + transactionId + ": " + e.getMessage());
        }
    }

    public void fixClaimDatesToManilaTime() {
        List<LaundryJob> claimedJobs = getClaimedJobs();
        int fixedCount = 0;

        for (LaundryJob job : claimedJobs) {
            try {
                if (job.getClaimDate() != null) {
                    System.out.println("📅 Existing Claim Date for " + job.getTransactionId() + 
                                     ": " + job.getClaimDate() + 
                                     " | Customer: " + job.getCustomerName());
                    
                    job.setClaimDate(getCurrentManilaTime());
                    laundryJobRepository.save(job);
                    fixedCount++;
                    
                }
            } catch (Exception e) {
                System.err.println("❌ Error fixing claim date for " + job.getTransactionId() + ": " + e.getMessage());
            }
        }

        System.out.println("✅ Fixed " + fixedCount + " claim dates to Manila time");
    }
}