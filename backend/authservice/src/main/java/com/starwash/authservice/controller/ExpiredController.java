package com.starwash.authservice.controller;

import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.service.LaundryJobService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expired")
@CrossOrigin(origins = "http://localhost:3000")
public class ExpiredController {

    private final LaundryJobService laundryJobService;

    public ExpiredController(LaundryJobService laundryJobService) {
        this.laundryJobService = laundryJobService;
    }

    /**
     * Get all expired laundry jobs
     */
    @GetMapping
    public ResponseEntity<List<LaundryJob>> getExpiredJobs(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<LaundryJob> expiredJobs = laundryJobService.getExpiredJobs();
            return ResponseEntity.ok(expiredJobs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Mark an expired job as disposed
     */
    @PatchMapping("/{transactionId}/dispose")
    public ResponseEntity<Void> disposeExpiredJob(
            @PathVariable String transactionId,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            LaundryJob job = laundryJobService.findSingleJobByTransaction(transactionId);
            
            if (!job.isExpired()) {
                return ResponseEntity.badRequest().build();
            }
            
            // You might want to add a new status like "DISPOSED" instead of deleting
            laundryJobService.deleteJobById(transactionId);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}