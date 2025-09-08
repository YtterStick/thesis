package com.starwash.authservice.controller;

import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.service.LaundryJobService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/laundry-jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class LaundryJobController {

    private final LaundryJobService laundryJobService;

    public LaundryJobController(LaundryJobService laundryJobService) {
        this.laundryJobService = laundryJobService;
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
                                                   @RequestBody LaundryJobDto dto) {
        LaundryJob existing = laundryJobService.findSingleJobByTransaction(transactionId);

        existing.setDetergentQty(dto.getDetergentQty());
        existing.setFabricQty(dto.getFabricQty());
        existing.setStatusFlow(dto.getStatusFlow());
        existing.setCurrentStep(dto.getCurrentStep());
        existing.setLoadAssignments(dto.getLoadAssignments());
        existing.setContact(dto.getContact()); // ✅ added contact

        LaundryJob updated = laundryJobService.updateJob(existing);
        return ResponseEntity.ok(toDto(updated));
    }

    // DELETE job
    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> deleteJob(@PathVariable String transactionId) {
        boolean deleted = laundryJobService.deleteJobById(transactionId);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    // Assign machine
    @PatchMapping("/{transactionId}/assign-machine")
    public ResponseEntity<LaundryJobDto> assignMachine(@PathVariable String transactionId,
                                                       @RequestParam int loadNumber,
                                                       @RequestParam String machineId) {
        LaundryJob job = laundryJobService.assignMachine(transactionId, loadNumber, machineId);
        return ResponseEntity.ok(toDto(job));
    }

    // Start load
    @PatchMapping("/{transactionId}/start-load")
    public ResponseEntity<LaundryJobDto> startLoad(@PathVariable String transactionId,
                                                   @RequestParam int loadNumber,
                                                   @RequestParam(required = false) Integer durationMinutes) {
        LaundryJob job = laundryJobService.startLoad(transactionId, loadNumber, durationMinutes);
        return ResponseEntity.ok(toDto(job));
    }

    // Dry Again - Reset drying timer
    @PatchMapping("/{transactionId}/dry-again")
    public ResponseEntity<LaundryJobDto> dryAgain(@PathVariable String transactionId,
                                                  @RequestParam int loadNumber) {
        LaundryJob job = laundryJobService.dryAgain(transactionId, loadNumber);
        return ResponseEntity.ok(toDto(job));
    }

    // Advance load
    @PatchMapping("/{transactionId}/advance-load")
    public ResponseEntity<LaundryJobDto> advanceLoad(@PathVariable String transactionId,
                                                     @RequestParam int loadNumber,
                                                     @RequestParam String status) {
        LaundryJob job = laundryJobService.advanceLoad(transactionId, loadNumber, status);
        return ResponseEntity.ok(toDto(job));
    }

    // Complete load
    @PatchMapping("/{transactionId}/complete-load")
    public ResponseEntity<LaundryJobDto> completeLoad(@PathVariable String transactionId,
                                                      @RequestParam int loadNumber) {
        LaundryJob job = laundryJobService.completeLoad(transactionId, loadNumber);
        return ResponseEntity.ok(toDto(job));
    }

    // Update load duration
    @PatchMapping("/{transactionId}/update-duration")
    public ResponseEntity<LaundryJobDto> updateLoadDuration(@PathVariable String transactionId,
                                                            @RequestParam int loadNumber,
                                                            @RequestParam int durationMinutes) {
        LaundryJob job = laundryJobService.updateLoadDuration(transactionId, loadNumber, durationMinutes);
        return ResponseEntity.ok(toDto(job));
    }

    // ========== DTO Conversion ==========
    private LaundryJobDto toDto(LaundryJob job) {
        LaundryJobDto dto = new LaundryJobDto();
        dto.setTransactionId(job.getTransactionId());
        dto.setCustomerName(job.getCustomerName());
        dto.setContact(job.getContact()); // ✅ include contact in DTO response
        dto.setLoadAssignments(job.getLoadAssignments());
        dto.setDetergentQty(job.getDetergentQty());
        dto.setFabricQty(job.getFabricQty());
        dto.setStatusFlow(job.getStatusFlow());
        dto.setCurrentStep(job.getCurrentStep());
        dto.setTotalLoads(job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0);
        return dto;
    }

    // ========== Exception Handling (basic) ==========
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntime(RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}