package com.starwash.authservice.controller;

import com.starwash.authservice.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
// Remove the restrictive @CrossOrigin since you have global CORS config
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/staff")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')") // Allow both staff and admin
    public ResponseEntity<Map<String, Object>> getStaffDashboard() {
        try {
            Map<String, Object> dashboardData = dashboardService.getStaffDashboardData();
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            e.printStackTrace(); // Add logging
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')") // Only admin can access
    public ResponseEntity<Map<String, Object>> getAdminDashboard() {
        try {
            Map<String, Object> dashboardData = dashboardService.getAdminDashboardData();
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            e.printStackTrace(); // Add logging
            return ResponseEntity.internalServerError().build();
        }
    }
}