package com.starwash.authservice.controller;

import com.starwash.authservice.model.LaundryJob;
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
    private final LaundryJobService laundryJobService;

    public ClaimingController(LaundryJobService laundryJobService) {
        this.laundryJobService = laundryJobService;
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
            log.error("❌ Failed to fetch completed unclaimed jobs: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Mark a laundry job as claimed
     */
    @PatchMapping("/{transactionId}/claim")
    public ResponseEntity<LaundryJob> claimLaundry(
            @PathVariable String transactionId,
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            LaundryJob claimedJob = laundryJobService.markAsClaimed(transactionId);
            log.info("✅ Laundry claimed | transactionId={} | customer={}", 
                    transactionId, claimedJob.getCustomerName());
            return ResponseEntity.ok(claimedJob);
        } catch (RuntimeException e) {
            log.error("❌ Failed to claim laundry for transaction {}: {}", transactionId, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("❌ Error claiming laundry: {}", e.getMessage());
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
            List<LaundryJob> claimedJobs = laundryJobService.getClaimedJobs();
            return ResponseEntity.ok(claimedJobs);
        } catch (Exception e) {
            log.error("❌ Failed to fetch claimed jobs: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}