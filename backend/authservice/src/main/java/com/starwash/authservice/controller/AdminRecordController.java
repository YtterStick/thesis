package com.starwash.authservice.controller;

import com.starwash.authservice.dto.AdminRecordResponseDto;
import com.starwash.authservice.service.TransactionService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

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

    // ✅ GET /api/admin/records/filtered — returns time-filtered paginated transaction records
    @GetMapping("/records/filtered")
    public ResponseEntity<List<AdminRecordResponseDto>> getAllAdminRecordsByTime(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "all") String timeFilter) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        // Validate pagination parameters
        if (page < 0) page = 0;
        if (size <= 0) size = 50;
        if (size > 1000) size = 1000;

        // Validate time filter
        List<String> validFilters = Arrays.asList("all", "today", "week", "month", "year");
        if (!validFilters.contains(timeFilter)) {
            return ResponseEntity.badRequest().build();
        }

        List<AdminRecordResponseDto> records = transactionService.getAllAdminRecordsByTime(page, size, timeFilter);
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

    // ✅ GET /api/admin/records/count/filtered — returns count for time-filtered records
    @GetMapping("/records/count/filtered")
    public ResponseEntity<Long> getTotalRecordsCountByTime(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "all") String timeFilter) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        // Validate time filter
        List<String> validFilters = Arrays.asList("all", "today", "week", "month", "year");
        if (!validFilters.contains(timeFilter)) {
            return ResponseEntity.badRequest().build();
        }

        long totalCount = transactionService.getTotalAdminRecordsCountByTime(timeFilter);
        return ResponseEntity.ok(totalCount);
    }

    // ✅ GET /api/admin/records/summary — returns summary for all records
    @GetMapping("/records/summary")
    public ResponseEntity<Map<String, Object>> getAdminRecordsSummary(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        Map<String, Object> summary = transactionService.getAdminRecordsSummary();
        return ResponseEntity.ok(summary);
    }

    // ✅ GET /api/admin/records/summary/{timeFilter} — returns time-filtered summary
    @GetMapping("/records/summary/{timeFilter}")
    public ResponseEntity<Map<String, Object>> getAdminRecordsSummaryByTime(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String timeFilter) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        // Validate time filter
        List<String> validFilters = Arrays.asList("all", "today", "week", "month", "year");
        if (!validFilters.contains(timeFilter)) {
            return ResponseEntity.badRequest().build();
        }

        Map<String, Object> summary = transactionService.getAdminRecordsSummaryByTime(timeFilter);
        return ResponseEntity.ok(summary);
    }

    // ✅ POST /api/admin/records/cache/clear — clear all cache (admin only)
    @PostMapping("/records/cache/clear")
    @CacheEvict(value = {"adminRecords", "adminRecordsCount", "adminSummary"}, allEntries = true)
    public ResponseEntity<Void> clearAdminRecordsCache(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        transactionService.evictAdminRecordsCache();
        transactionService.evictAdminSummaryCache();
        return ResponseEntity.ok().build();
    }

    // ✅ POST /api/admin/records/cache/clear/records — clear only records cache
    @PostMapping("/records/cache/clear/records")
    @CacheEvict(value = {"adminRecords", "adminRecordsCount"}, allEntries = true)
    public ResponseEntity<Void> clearAdminRecordsCacheOnly(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        transactionService.evictAdminRecordsCache();
        return ResponseEntity.ok().build();
    }

    // ✅ POST /api/admin/records/cache/clear/summary — clear only summary cache
    @PostMapping("/records/cache/clear/summary")
    @CacheEvict(value = "adminSummary", allEntries = true)
    public ResponseEntity<Void> clearAdminSummaryCacheOnly(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        transactionService.evictAdminSummaryCache();
        return ResponseEntity.ok().build();
    }
}