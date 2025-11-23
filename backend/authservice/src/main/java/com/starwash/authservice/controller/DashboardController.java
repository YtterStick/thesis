package com.starwash.authservice.controller;

import com.starwash.authservice.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/staff")
    public ResponseEntity<Map<String, Object>> getStaffDashboard(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            Map<String, Object> dashboardData = dashboardService.getStaffDashboardData();
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Admin dashboard endpoint
    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getAdminDashboard(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            Map<String, Object> dashboardData = dashboardService.getAdminDashboardData();
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // NEW: Admin dashboard totals endpoint (for accurate totals without pagination)
    @GetMapping("/admin/totals")
    public ResponseEntity<Map<String, Object>> getAdminDashboardTotals(
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            Map<String, Object> dashboardTotals = dashboardService.getAdminDashboardTotals();
            return ResponseEntity.ok(dashboardTotals);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}