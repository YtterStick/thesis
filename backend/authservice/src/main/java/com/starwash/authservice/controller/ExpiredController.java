package com.starwash.authservice.controller;

import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.LaundryJobService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expired")
@CrossOrigin(origins = "http://localhost:3000")
public class ExpiredController {

    private final LaundryJobService laundryJobService;
    private final JwtUtil jwtUtil;

    public ExpiredController(LaundryJobService laundryJobService, JwtUtil jwtUtil) {
        this.laundryJobService = laundryJobService;
        this.jwtUtil = jwtUtil;
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
    public ResponseEntity<LaundryJob> disposeExpiredJob(
            @PathVariable String transactionId,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            String token = authHeader.replace("Bearer ", "");
            String username = jwtUtil.getUsername(token);
            
            LaundryJob job = laundryJobService.disposeJob(transactionId, username);
            return ResponseEntity.ok(job);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all disposed jobs
     */
    @GetMapping("/disposed")
    public ResponseEntity<List<LaundryJob>> getDisposedJobs(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<LaundryJob> disposedJobs = laundryJobService.getDisposedJobs();
            return ResponseEntity.ok(disposedJobs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}