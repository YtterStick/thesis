package com.starwash.authservice.controller;

import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.dto.LaundryJobPageDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.service.LaundryJobService;
import com.starwash.authservice.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/laundry-jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class LaundryJobController {

    private final LaundryJobService laundryJobService;
    private final JwtUtil jwtUtil;

    public LaundryJobController(LaundryJobService laundryJobService, JwtUtil jwtUtil) {
        this.laundryJobService = laundryJobService;
        this.jwtUtil = jwtUtil;
    }

    // OPTIMIZED: GET all laundry jobs with pagination
    @GetMapping
    public ResponseEntity<LaundryJobPageDto> getAllJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            LaundryJobPageDto jobsPage = laundryJobService.getJobsForTracking(page, size);
            return ResponseEntity.ok(jobsPage);
        } catch (Exception e) {
            System.err.println("❌ Error fetching paginated jobs: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // NEW: Get simplified jobs for faster loading
    @GetMapping("/simplified")
    public ResponseEntity<LaundryJobPageDto> getSimplifiedJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        try {
            LaundryJobPageDto jobsPage = laundryJobService.getSimplifiedJobs(page, size);
            return ResponseEntity.ok(jobsPage);
        } catch (Exception e) {
            System.err.println("❌ Error fetching simplified jobs: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // Keep existing endpoint for backward compatibility
    @GetMapping("/all")
    public ResponseEntity<List<LaundryJobDto>> getAllJobsLegacy() {
        try {
            List<LaundryJobDto> jobs = laundryJobService.getAllJobs();
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            System.err.println("❌ Error fetching all jobs: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // GET single job by transactionId
    @GetMapping("/{transactionId}")
    public ResponseEntity<LaundryJobDto> getJob(@PathVariable String transactionId) {
        try {
            LaundryJob job = laundryJobService.findSingleJobByTransaction(transactionId);
            return ResponseEntity.ok(toDto(job));
        } catch (Exception e) {
            System.err.println("❌ Error fetching job: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // CREATE new job
    @PostMapping
    public ResponseEntity<LaundryJobDto> createJob(@RequestBody LaundryJobDto dto) {
        try {
            LaundryJob job = laundryJobService.createJob(dto);
            return ResponseEntity.ok(toDto(job));
        } catch (Exception e) {
            System.err.println("❌ Error creating job: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // UPDATE job (replace core fields)
    @PutMapping("/{transactionId}")
    public ResponseEntity<LaundryJobDto> updateJob(@PathVariable String transactionId,
            @RequestBody LaundryJobDto dto,
            @RequestHeader("Authorization") String authHeader) {
        try {
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
        } catch (Exception e) {
            System.err.println("❌ Error updating job: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // DELETE job
    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> deleteJob(@PathVariable String transactionId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
            boolean deleted = laundryJobService.deleteJobById(transactionId, username);
            return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("❌ Error deleting job: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Assign machine
    @PatchMapping("/{transactionId}/assign-machine")
    public ResponseEntity<LaundryJobDto> assignMachine(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestParam String machineId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
            LaundryJob job = laundryJobService.assignMachine(transactionId, loadNumber, machineId, username);
            return ResponseEntity.ok(toDto(job));
        } catch (Exception e) {
            System.err.println("❌ Error assigning machine: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{transactionId}/force-advance")
    public ResponseEntity<LaundryJobDto> forceAdvanceLoad(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
            LaundryJob job = laundryJobService.forceAdvanceLoad(transactionId, loadNumber, username);
            return ResponseEntity.ok(toDto(job));
        } catch (Exception e) {
            System.err.println("❌ Error force advancing load: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Start load
    @PatchMapping("/{transactionId}/start-load")
    public ResponseEntity<LaundryJobDto> startLoad(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
            LaundryJob job = laundryJobService.startLoad(transactionId, loadNumber, durationMinutes, username);
            return ResponseEntity.ok(toDto(job));
        } catch (Exception e) {
            System.err.println("❌ Error starting load: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Dry Again - Reset drying timer
    @PatchMapping("/{transactionId}/dry-again")
    public ResponseEntity<LaundryJobDto> dryAgain(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
            LaundryJob job = laundryJobService.dryAgain(transactionId, loadNumber, username);
            return ResponseEntity.ok(toDto(job));
        } catch (Exception e) {
            System.err.println("❌ Error drying again: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Advance load
    @PatchMapping("/{transactionId}/advance-load")
    public ResponseEntity<LaundryJobDto> advanceLoad(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestParam String status,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
            LaundryJob job = laundryJobService.advanceLoad(transactionId, loadNumber, status, username);
            return ResponseEntity.ok(toDto(job));
        } catch (Exception e) {
            System.err.println("❌ Error advancing load: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Complete load
    @PatchMapping("/{transactionId}/complete-load")
    public ResponseEntity<LaundryJobDto> completeLoad(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
            LaundryJob job = laundryJobService.completeLoad(transactionId, loadNumber, username);
            return ResponseEntity.ok(toDto(job));
        } catch (Exception e) {
            System.err.println("❌ Error completing load: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Update load duration
    @PatchMapping("/{transactionId}/update-duration")
    public ResponseEntity<LaundryJobDto> updateLoadDuration(@PathVariable String transactionId,
            @RequestParam int loadNumber,
            @RequestParam int durationMinutes,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String username = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
            LaundryJob job = laundryJobService.updateLoadDuration(transactionId, loadNumber, durationMinutes, username);
            return ResponseEntity.ok(toDto(job));
        } catch (Exception e) {
            System.err.println("❌ Error updating duration: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
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
        try {
            List<LaundryJob> jobs = laundryJobService.searchLaundryJobsByCustomerName(customerName);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            System.err.println("❌ Error searching jobs: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}