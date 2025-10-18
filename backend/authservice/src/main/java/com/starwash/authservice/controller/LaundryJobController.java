package com.starwash.authservice.controller;

import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.service.LaundryJobService;
import com.starwash.authservice.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // Sync timer states
    @PostMapping("/{transactionId}/sync-timer")
    public ResponseEntity<LaundryJobDto> syncTimerState(@PathVariable String transactionId) {
        LaundryJob job = laundryJobService.findSingleJobByTransaction(transactionId);
        laundryJobService.syncTimerStates(job);
        LaundryJob updatedJob = laundryJobService.updateJob(job, "system");
        return ResponseEntity.ok(toDto(updatedJob));
    }

    // Get all jobs with synced timer states
    @GetMapping("/with-synced-timers")
    public ResponseEntity<List<LaundryJobDto>> getAllJobsWithSyncedTimers() {
        List<LaundryJobDto> jobs = laundryJobService.getAllJobs();
        
        for (LaundryJobDto jobDto : jobs) {
            LaundryJob job = laundryJobService.findSingleJobByTransaction(jobDto.getTransactionId());
            laundryJobService.syncTimerStates(job);
        }
        
        return ResponseEntity.ok(jobs);
    }

    // Search by customer name
    @GetMapping("/search-by-customer")
    public ResponseEntity<List<LaundryJob>> searchLaundryJobsByCustomerName(
            @RequestParam String customerName) {
        List<LaundryJob> jobs = laundryJobService.searchLaundryJobsByCustomerName(customerName);
        return ResponseEntity.ok(jobs);
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
}