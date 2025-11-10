// AuditController.java
package com.starwash.authservice.controller;

import com.starwash.authservice.model.AuditLog;
import com.starwash.authservice.service.AuditService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<?> getAllAuditLogs() {
        try {
            List<AuditLog> logs = auditService.getAllLogs();
            return ResponseEntity.ok(Map.of("logs", logs));
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
    public ResponseEntity<?> getLogsByUser(@PathVariable String username) {
        try {
            List<AuditLog> logs = auditService.getLogsByUser(username);
            return ResponseEntity.ok(Map.of("logs", logs));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch user logs: " + e.getMessage()));
        }
    }

    @GetMapping("/action/{action}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getLogsByAction(@PathVariable String action) {
        try {
            List<AuditLog> logs = auditService.getLogsByAction(action);
            return ResponseEntity.ok(Map.of("logs", logs));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch action logs: " + e.getMessage()));
        }
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        try {
            List<AuditLog> logs = auditService.getLogsByDateRange(start, end);
            return ResponseEntity.ok(Map.of("logs", logs));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch date range logs: " + e.getMessage()));
        }
    }
}