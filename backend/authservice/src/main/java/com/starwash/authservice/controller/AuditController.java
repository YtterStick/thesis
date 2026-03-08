// AuditController.java
package com.starwash.authservice.controller;

import com.starwash.authservice.model.AuditLog;
import com.starwash.authservice.service.AuditService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/audit-logs")
@CrossOrigin(origins = "http://localhost:3000")
public class AuditController {
    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AuditLog> logsPage = auditService.getAllLogs(pageable);
            return ResponseEntity.ok(Map.of(
                    "logs", logsPage.getContent(),
                    "totalPages", logsPage.getTotalPages(),
                    "totalElements", logsPage.getTotalElements(),
                    "currentPage", logsPage.getNumber()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch audit logs: " + e.getMessage()));
        }
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> exportAuditLogs() {
        try {
            List<AuditLog> logs = auditService.getAllLogs();
            return ResponseEntity.ok(Map.of("logs", logs));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to export audit logs: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getLogsByUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AuditLog> logsPage = auditService.getLogsByUser(username, pageable);
            return ResponseEntity.ok(Map.of(
                    "logs", logsPage.getContent(),
                    "totalPages", logsPage.getTotalPages(),
                    "totalElements", logsPage.getTotalElements()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch user logs: " + e.getMessage()));
        }
    }

    @GetMapping("/action/{action}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getLogsByAction(
            @PathVariable String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AuditLog> logsPage = auditService.getLogsByAction(action, pageable);
            return ResponseEntity.ok(Map.of(
                    "logs", logsPage.getContent(),
                    "totalPages", logsPage.getTotalPages(),
                    "totalElements", logsPage.getTotalElements()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch action logs: " + e.getMessage()));
        }
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AuditLog> logsPage = auditService.getLogsByDateRange(start, end, pageable);
            return ResponseEntity.ok(Map.of(
                    "logs", logsPage.getContent(),
                    "totalPages", logsPage.getTotalPages(),
                    "totalElements", logsPage.getTotalElements()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch date range logs: " + e.getMessage()));
        }
    }
}