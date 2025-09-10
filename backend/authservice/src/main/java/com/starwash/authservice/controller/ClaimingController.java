package com.starwash.authservice.controller;

import com.starwash.authservice.dto.ServiceClaimReceiptDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.ClaimingService;
import com.starwash.authservice.service.LaundryJobService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claiming")
@CrossOrigin(origins = "http://localhost:3000")
public class ClaimingController {

    private static final Logger log = LoggerFactory.getLogger(ClaimingController.class);

    private final ClaimingService claimingService;
    private final LaundryJobService laundryJobService;
    private final JwtUtil jwtUtil;

    public ClaimingController(ClaimingService claimingService,
                              LaundryJobService laundryJobService,
                              JwtUtil jwtUtil) {
        this.claimingService = claimingService;
        this.laundryJobService = laundryJobService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Get all completed and unclaimed laundry jobs
     */
    @GetMapping("/completed-unclaimed")
    public ResponseEntity<List<LaundryJob>> getCompletedUnclaimedJobs(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<LaundryJob> completedJobs = laundryJobService.getCompletedUnclaimedJobs();
            return ResponseEntity.ok(completedJobs);
        } catch (Exception e) {
            log.error("❌ Failed to fetch completed unclaimed jobs: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Mark a laundry job as claimed and generate claim receipt
     */
    @PatchMapping("/{transactionId}/claim")
    public ResponseEntity<ServiceClaimReceiptDto> claimLaundry(
            @PathVariable String transactionId,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            String token = authHeader.replace("Bearer ", "");
            String staffId = jwtUtil.extractUsername(token);

            ServiceClaimReceiptDto receipt = claimingService.claimLaundry(transactionId, staffId);

            log.info("✅ Laundry claimed | transactionId={} | staff={} | customer={} | claimReceipt={}",
                    transactionId, staffId, receipt.getCustomerName(), receipt.getClaimReceiptNumber());

            return ResponseEntity.ok(receipt);

        } catch (RuntimeException e) {
            String message = e.getMessage() != null ? e.getMessage() : "Unknown error";
            if (message.contains("not found")) {
                log.warn("⚠️ Claim attempt failed (not found) | transactionId={}", transactionId);
                return ResponseEntity.notFound().build();
            }
            if (message.contains("already claimed")) {
                log.warn("⚠️ Claim attempt failed (already claimed) | transactionId={}", transactionId);
                return ResponseEntity.badRequest().body(null);
            }
            log.error("❌ Failed to claim laundry for transaction {}: {}", transactionId, message);
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            log.error("❌ Error claiming laundry: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get claim receipt for a specific transaction
     */
    @GetMapping("/{transactionId}/claim-receipt")
    public ResponseEntity<ServiceClaimReceiptDto> getClaimReceipt(
            @PathVariable String transactionId,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            ServiceClaimReceiptDto receipt = claimingService.getClaimReceipt(transactionId);
            return ResponseEntity.ok(receipt);

        } catch (RuntimeException e) {
            String message = e.getMessage() != null ? e.getMessage() : "Unknown error";
            log.error("❌ Failed to fetch claim receipt for transaction {}: {}", transactionId, message);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("❌ Error fetching claim receipt: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all claimed laundry jobs (for history/records)
     */
    @GetMapping("/claimed")
    public ResponseEntity<List<LaundryJob>> getClaimedJobs(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<LaundryJob> claimedJobs = claimingService.getClaimedJobs();
            return ResponseEntity.ok(claimedJobs);
        } catch (Exception e) {
            log.error("❌ Failed to fetch claimed jobs: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
