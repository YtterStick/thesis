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

    @PostMapping
    public ResponseEntity<LaundryJob> createJob(@RequestBody LaundryJobDto dto,
                                                @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(laundryJobService.createJob(dto));
    }

    @PatchMapping("/{id}/step")
    public ResponseEntity<Void> updateStep(@PathVariable String id,
                                           @RequestBody Integer newStep,
                                           @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        laundryJobService.updateCurrentStep(id, newStep);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<LaundryJobDto>> getAllJobs(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(laundryJobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LaundryJob> getJob(@PathVariable String id,
                                             @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(laundryJobService.getJobById(id));
    }
}