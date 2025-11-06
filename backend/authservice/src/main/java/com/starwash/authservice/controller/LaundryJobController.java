package com.starwash.authservice.controller;

import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.service.LaundryJobService;
import com.starwash.authservice.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/laundry-jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class LaundryJobController {

    private final LaundryJobService laundryJobService;
    private final JwtUtil jwtUtil;

    public LaundryJobController(LaundryJobService laundryJobService, JwtUtil jwtUtil) {
        this.laundryJobService = laundryJobService;
        this.jwtUtil = jwtUtil;
    }

    // GET all laundry jobs
    @GetMapping
    public ResponseEntity<List<LaundryJobDto>> getAllJobs() {
        return ResponseEntity.ok(laundryJobService.getAllJobs());
    }

    // GET single job by transactionId
    @GetMapping("/{transactionId}")
    public ResponseEntity<LaundryJobDto> getJob(@PathVariable String transactionId) {
        LaundryJob job = laundryJobService.findSingleJobByTransaction(transactionId);
        return ResponseEntity.ok(toDto(job));
    }

    // CREATE new job
    @PostMapping
    public ResponseEntity<LaundryJobDto> createJob(@RequestBody LaundryJobDto dto) {
        LaundryJob job = laundryJobService.createJob(dto);
        return ResponseEntity.ok(toDto(job));
    }

    // UPDATE job (replace core fields)
    @PutMapping("/{transactionId}")
    public ResponseEntity<LaundryJobDto> updateJob(@PathVariable String transactionId,
            @RequestBody LaundryJobDto dto,
            @RequestHeader("Authorization") String authHeader) {
        String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        LaundryJob existing = laundryJobService.findSingleJobByTransaction(transactionId);

        existing.setDetergentQty(dto.getDetergentQty());
        existing.setFabricQty(dto.getFabricQty());
        existing.setStatusFlow(dto.getStatusFlow());
        existing.setCurrentStep(dto.getCurrentStep());
        existing.setLoadAssignments(dto.getLoadAssignments());
        existing.setContact(dto.getContact());

        LaundryJob updated = laundryJobService.updateJob(existing, username);
        return ResponseEntity.ok(toDto(updated));
    }

    // DELETE job
    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> deleteJob(@PathVariable String transactionId,
            @RequestHeader("Authorization") String authHeader) {
        String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        boolean deleted = laundryJobService.deleteJobById(transactionId, username);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    // Assign machine
    @PatchMapping("/{transactionId}/assign-machine")
    public ResponseEntity<LaundryJobDto> assignMachine(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestParam String machineId,
            @RequestHeader("Authorization") String authHeader) {
        String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        LaundryJob job = laundryJobService.assignMachine(transactionId, loadNumber, machineId, username);
        return ResponseEntity.ok(toDto(job));
    }

    @PatchMapping("/{transactionId}/force-advance")
    public ResponseEntity<LaundryJobDto> forceAdvanceLoad(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestHeader("Authorization") String authHeader) {
        String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        LaundryJob job = laundryJobService.forceAdvanceLoad(transactionId, loadNumber, username);
        return ResponseEntity.ok(toDto(job));
    }

    // Start load
    @PatchMapping("/{transactionId}/start-load")
    public ResponseEntity<LaundryJobDto> startLoad(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestHeader("Authorization") String authHeader) {
        String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        LaundryJob job = laundryJobService.startLoad(transactionId, loadNumber, durationMinutes, username);
        return ResponseEntity.ok(toDto(job));
    }

    // Dry Again - Reset drying timer
    @PatchMapping("/{transactionId}/dry-again")
    public ResponseEntity<LaundryJobDto> dryAgain(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestHeader("Authorization") String authHeader) {
        String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        LaundryJob job = laundryJobService.dryAgain(transactionId, loadNumber, username);
        return ResponseEntity.ok(toDto(job));
    }

    // Advance load
    @PatchMapping("/{transactionId}/advance-load")
    public ResponseEntity<LaundryJobDto> advanceLoad(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestParam String status,
            @RequestHeader("Authorization") String authHeader) {
        String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        LaundryJob job = laundryJobService.advanceLoad(transactionId, loadNumber, status, username);
        return ResponseEntity.ok(toDto(job));
    }

    // Complete load
    @PatchMapping("/{transactionId}/complete-load")
    public ResponseEntity<LaundryJobDto> completeLoad(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestHeader("Authorization") String authHeader) {
        String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        LaundryJob job = laundryJobService.completeLoad(transactionId, loadNumber, username);
        return ResponseEntity.ok(toDto(job));
    }

    // Update load duration
    @PatchMapping("/{transactionId}/update-duration")
    public ResponseEntity<LaundryJobDto> updateLoadDuration(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestParam int durationMinutes,
            @RequestHeader("Authorization") String authHeader) {
        String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        LaundryJob job = laundryJobService.updateLoadDuration(transactionId, loadNumber, durationMinutes, username);
        return ResponseEntity.ok(toDto(job));
    }

    // NEW ENDPOINT: Get completed today count
    @GetMapping("/completed-today-count")
    public ResponseEntity<Integer> getCompletedTodayCount() {
        try {
            int count = laundryJobService.getCompletedTodayCount();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            System.err.println("❌ Error getting completed today count: " + e.getMessage());
            return ResponseEntity.internalServerError().body(0);
        }
    }

    // NEW ENDPOINT: Get all completed count
    @GetMapping("/all-completed-count")
    public ResponseEntity<Integer> getAllCompletedCount() {
        try {
            int count = laundryJobService.getAllCompletedCount();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            System.err.println("❌ Error getting all completed count: " + e.getMessage());
            return ResponseEntity.internalServerError().body(0);
        }
    }

    // ========== AUTO-HEALING SYNC ENDPOINTS ==========

    /**
     * Get sync status for a specific job
     */
    @GetMapping("/{transactionId}/sync-status")
    public ResponseEntity<Map<String, Object>> getSyncStatus(@PathVariable String transactionId) {
        try {
            Map<String, Object> status = laundryJobService.getSyncStatus(transactionId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get sync status: " + e.getMessage(),
                "transactionId", transactionId
            ));
        }
    }

    /**
     * Manually trigger verification and healing for a specific job
     */
    @PostMapping("/{transactionId}/verify-and-heal")
    public ResponseEntity<Map<String, Object>> verifyAndHealJob(@PathVariable String transactionId) {
        try {
            Map<String, Object> result = laundryJobService.verifyAndHealJob(transactionId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to verify and heal job: " + e.getMessage(),
                "transactionId", transactionId
            ));
        }
    }

    /**
     * Bulk verify and heal all jobs
     */
    @PostMapping("/bulk-verify-and-heal")
    public ResponseEntity<Map<String, Object>> verifyAllJobs() {
        try {
            Map<String, Object> result = laundryJobService.verifyAllJobs();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to bulk verify jobs: " + e.getMessage()
            ));
        }
    }

    /**
     * Check and fix timer states for a specific job
     */
    @PostMapping("/{transactionId}/fix-timers")
    public ResponseEntity<Map<String, Object>> fixTimerStates(@PathVariable String transactionId) {
        try {
            laundryJobService.checkAndFixTimerStates(transactionId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Timer states checked and fixed for " + transactionId,
                "transactionId", transactionId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to fix timer states: " + e.getMessage(),
                "transactionId", transactionId
            ));
        }
    }

    // ========== DTO Conversion ==========
    private LaundryJobDto toDto(LaundryJob job) {
        LaundryJobDto dto = new LaundryJobDto();
        dto.setTransactionId(job.getTransactionId());
        dto.setCustomerName(job.getCustomerName());
        dto.setContact(job.getContact());
        dto.setLoadAssignments(job.getLoadAssignments());
        dto.setDetergentQty(job.getDetergentQty());
        dto.setFabricQty(job.getFabricQty());
        dto.setStatusFlow(job.getStatusFlow());
        dto.setCurrentStep(job.getCurrentStep());
        dto.setTotalLoads(job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0);
        return dto;
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntime(RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @GetMapping("/search-by-customer")
    public ResponseEntity<List<LaundryJob>> searchLaundryJobsByCustomerName(
            @RequestParam String customerName) {
        List<LaundryJob> jobs = laundryJobService.searchLaundryJobsByCustomerName(customerName);
        return ResponseEntity.ok(jobs);
    }
}