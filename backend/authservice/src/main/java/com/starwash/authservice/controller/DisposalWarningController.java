package com.starwash.authservice.controller;

import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.service.LaundryJobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/disposal-warnings")
@CrossOrigin(origins = "http://localhost:3000")
public class DisposalWarningController {

    @Autowired
    private LaundryJobService laundryJobService;

    @PostMapping("/send-manual")
    public ResponseEntity<Map<String, Object>> sendManualDisposalWarnings() {
        try {
            Map<String, Object> result = laundryJobService.manuallyTriggerDisposalWarnings();
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Disposal warnings sent successfully");
            response.put("data", result);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Failed to send disposal warnings: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingDisposalWarnings() {
        try {
            List<LaundryJob> jobs = laundryJobService.getJobsNeedingDisposalWarnings();
            
            Map<String, Object> response = new HashMap<>();
            response.put("pendingJobs", jobs);
            response.put("count", jobs.size());
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Failed to get pending disposal warnings: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/send-for-job/{transactionId}")
    public ResponseEntity<Map<String, Object>> sendDisposalWarningForJob(@PathVariable String transactionId) {
        try {
            LaundryJob job = laundryJobService.findSingleJobByTransaction(transactionId);
            laundryJobService.checkAndSendDisposalWarningsForJob(job);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Disposal warning sent successfully for job: " + transactionId);
            response.put("customerName", job.getCustomerName());
            response.put("contact", job.getContact());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Failed to send disposal warning for job " + transactionId + ": " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}