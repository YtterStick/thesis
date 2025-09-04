package com.starwash.authservice.controller;

import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.service.LaundryJobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/laundry-jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class LaundryJobController {

    @Autowired
    private LaundryJobService laundryJobService;

    // GET all laundry jobs
    @GetMapping
    public ResponseEntity<List<LaundryJobDto>> getAllJobs() {
        List<LaundryJobDto> dtos = laundryJobService.getAllJobs();
        return ResponseEntity.ok(dtos);
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

    // UPDATE job
    @PutMapping("/{transactionId}")
    public ResponseEntity<LaundryJobDto> updateJob(@PathVariable String transactionId, @RequestBody LaundryJobDto dto) {
        LaundryJob existing = laundryJobService.findSingleJobByTransaction(transactionId);

        existing.setDetergentQty(dto.getDetergentQty());
        existing.setFabricQty(dto.getFabricQty());
        existing.setStatusFlow(dto.getStatusFlow());
        existing.setCurrentStep(dto.getCurrentStep());
        existing.setLoadAssignments(dto.getLoadAssignments());

        LaundryJob updated = laundryJobService.updateJob(existing);
        return ResponseEntity.ok(toDto(updated));
    }

    // DELETE job
    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> deleteJob(@PathVariable String transactionId) {
        boolean deleted = laundryJobService.deleteJobById(transactionId);
        if (!deleted) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().build();
    }

    // Assign machine
    @PatchMapping("/{transactionId}/assign-machine")
    public ResponseEntity<Void> assignMachine(@PathVariable String transactionId,
                                              @RequestParam int loadNumber,
                                              @RequestParam String machineId) {
        laundryJobService.assignMachine(transactionId, loadNumber, machineId);
        return ResponseEntity.ok().build();
    }

    // Start load
    @PatchMapping("/{transactionId}/start-load")
    public ResponseEntity<Void> startLoad(@PathVariable String transactionId,
                                          @RequestParam int loadNumber,
                                          @RequestParam Integer durationMinutes) {
        laundryJobService.startLoad(transactionId, loadNumber, durationMinutes);
        return ResponseEntity.ok().build();
    }

    // Complete load
    @PatchMapping("/{transactionId}/complete-load")
    public ResponseEntity<Void> completeLoad(@PathVariable String transactionId,
                                             @RequestParam int loadNumber) {
        laundryJobService.completeLoad(transactionId, loadNumber);
        return ResponseEntity.ok().build();
    }

    // Update load duration
    @PatchMapping("/{transactionId}/update-duration")
    public ResponseEntity<Void> updateLoadDuration(@PathVariable String transactionId,
                                                   @RequestParam int loadNumber,
                                                   @RequestParam int durationMinutes) {
        laundryJobService.updateLoadDuration(transactionId, loadNumber, durationMinutes);
        return ResponseEntity.ok().build();
    }

    // Convert LaundryJob to DTO
    private LaundryJobDto toDto(LaundryJob job) {
        LaundryJobDto dto = new LaundryJobDto();
        dto.setTransactionId(job.getTransactionId());
        dto.setCustomerName(job.getCustomerName());
        dto.setLoadAssignments(job.getLoadAssignments());
        dto.setDetergentQty(job.getDetergentQty());
        dto.setFabricQty(job.getFabricQty());
        dto.setStatusFlow(job.getStatusFlow());
        dto.setCurrentStep(job.getCurrentStep());
        dto.setTotalLoads(job.getLoadAssignments() != null ? job.getLoadAssignments().size() : 0);
        return dto;
    }
}
