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

    // ✅ GET /api/admin/records — returns paginated transaction records with admin
    // fields
    @GetMapping("/records")
    public ResponseEntity<List<AdminRecordResponseDto>> getAllAdminRecords(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        System.out.println("📋 Fetching all admin records - Page: " + page + ", Size: " + size + ", Search: " + search);
        return ResponseEntity.ok(transactionService.getAllAdminRecords(page, size, search));
    }

    // ✅ GET /api/admin/records/filtered — returns time-filtered records
    @GetMapping("/records/filtered")
    public ResponseEntity<List<AdminRecordResponseDto>> getAdminRecordsByTime(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "today") String timeFilter,
            @RequestParam(required = false) String search) {
        System.out.println("🔍 Fetching admin records by time - Filter: " + timeFilter + ", Page: " + page + ", Size: " + size
                + ", Search: " + search);

        List<String> validFilters = Arrays.asList("today", "week", "month", "year", "all");
        if (!validFilters.contains(timeFilter)) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(transactionService.getAllAdminRecordsByTime(page, size, timeFilter, search));
    }

    // ✅ GET /api/admin/records/count — returns total count for pagination
    @GetMapping("/records/count")
    public ResponseEntity<Long> getTotalAdminRecordsCount(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String search) {
        long totalCount = transactionService.getTotalAdminRecordsCount(search);
        return ResponseEntity.ok(totalCount);
    }

    // ✅ GET /api/admin/records/count/filtered — returns total count for time-filtered
    // records
    @GetMapping("/records/count/filtered")
    public ResponseEntity<Long> getTotalAdminRecordsCountByTime(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "today") String timeFilter,
            @RequestParam(required = false) String search) {
        long totalCount = transactionService.getTotalAdminRecordsCountByTime(timeFilter, search);
        return ResponseEntity.ok(totalCount);
    }

    // ✅ GET /api/admin/records/summary — returns total summary (Income, Loads, etc.)
    @GetMapping("/records/summary")
    public ResponseEntity<Map<String, Object>> getAdminRecordsSummary(
            @RequestHeader("Authorization") String authHeader) {
        System.out.println("📊 Fetching global admin records summary...");
        Map<String, Object> summary = transactionService.getAdminRecordsSummary();
        return ResponseEntity.ok(summary);
    }

    // ✅ GET /api/admin/records/summary/{timeFilter} — returns time-filtered summary
    @GetMapping("/records/summary/{timeFilter}")
    public ResponseEntity<Map<String, Object>> getAdminRecordsSummaryByTime(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String timeFilter) {
        System.out.println("📊 Fetching admin records summary for: " + timeFilter);

        List<String> validFilters = Arrays.asList("today", "week", "month", "year", "all");
        if (!validFilters.contains(timeFilter)) {
            return ResponseEntity.badRequest().build();
        }

        Map<String, Object> summary = transactionService.getAdminRecordsSummaryByTime(timeFilter);
        return ResponseEntity.ok(summary);
    }

    // ✅ POST /api/admin/records/clear-cache — manual cache eviction
    @PostMapping("/records/clear-cache")
    @CacheEvict(value = { "adminRecords", "adminSummary", "adminRecordsCount" }, allEntries = true)
    public ResponseEntity<String> clearAdminCache() {
        System.out.println("🧹 Clearing all admin record caches...");
        return ResponseEntity.ok("Admin caches cleared successfully!");
    }
}
