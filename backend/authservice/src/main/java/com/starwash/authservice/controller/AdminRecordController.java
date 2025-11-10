package com.starwash.authservice.controller;

import com.starwash.authservice.dto.AdminRecordResponseDto;
import com.starwash.authservice.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminRecordController {

    private final TransactionService transactionService;

    public AdminRecordController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // ✅ GET /api/admin/records — returns paginated transaction records with admin fields
    @GetMapping("/records")
    public ResponseEntity<List<AdminRecordResponseDto>> getAllAdminRecords(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        // Validate pagination parameters
        if (page < 0) page = 0;
        if (size <= 0) size = 50;
        if (size > 1000) size = 1000; // Limit maximum page size

        List<AdminRecordResponseDto> records = transactionService.getAllAdminRecords(page, size);
        return ResponseEntity.ok(records);
    }

    // ✅ GET /api/admin/records/count — returns total count for pagination
    @GetMapping("/records/count")
    public ResponseEntity<Long> getTotalRecordsCount(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        long totalCount = transactionService.getTotalAdminRecordsCount();
        return ResponseEntity.ok(totalCount);
    }

    // ✅ POST /api/admin/records/cache/clear — clear cache (admin only)
    @PostMapping("/records/cache/clear")
    public ResponseEntity<Void> clearAdminRecordsCache(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        transactionService.evictAdminRecordsCache();
        return ResponseEntity.ok().build();
    }
}