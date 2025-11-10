package com.starwash.authservice.controller;

import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.LaundryJobService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/expired")
@CrossOrigin(origins = "http://localhost:3000")
public class ExpiredController {

    private final LaundryJobService laundryJobService;
    private final JwtUtil jwtUtil;

    public ExpiredController(LaundryJobService laundryJobService, JwtUtil jwtUtil) {
        this.laundryJobService = laundryJobService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public ResponseEntity<?> getExpiredJobs(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(
                    Map.of("error", "Unauthorized", "message", "Missing or invalid Authorization header"));
        }

        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(401).body(
                        Map.of("error", "Unauthorized", "message", "Invalid or expired token"));
            }

            List<LaundryJob> expiredJobs = laundryJobService.getExpiredJobs();
            return ResponseEntity.ok(expiredJobs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Internal server error", "message", e.getMessage()));
        }
    }

    /**
     * Mark an expired job as disposed
     */
    /**
     * Mark an expired job as disposed
     */
    @PatchMapping("/{id}/dispose")
    public ResponseEntity<?> disposeExpiredJob(
            @PathVariable String id, // Changed from transactionId to id
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(401).build();
            }

            String username = jwtUtil.getUsername(token);
            LaundryJob job = laundryJobService.disposeJob(id, username); // Pass the MongoDB id
            return ResponseEntity.ok(job);
        } catch (RuntimeException e) {
            // Handle specific exceptions
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(404).body(
                        Map.of("error", "Laundry job not found", "message", e.getMessage()));
            }
            if (e.getMessage().contains("non-expired") || e.getMessage().contains("already disposed")) {
                return ResponseEntity.status(400).body(
                        Map.of("error", "Invalid operation", "message", e.getMessage()));
            }
            return ResponseEntity.status(400).body(
                    Map.of("error", "Failed to dispose job", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Internal server error", "message", e.getMessage()));
        }
    }

    @GetMapping("/disposed")
    public ResponseEntity<?> getDisposedJobs(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(
                    Map.of("error", "Unauthorized", "message", "Missing or invalid Authorization header"));
        }

        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(401).body(
                        Map.of("error", "Unauthorized", "message", "Invalid or expired token"));
            }

            List<LaundryJob> disposedJobs = laundryJobService.getDisposedJobs();
            return ResponseEntity.ok(disposedJobs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Internal server error", "message", e.getMessage()));
        }
    }
}