package com.starwash.authservice.controller;

import com.starwash.authservice.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/staff")
    @PreAuthorize("hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStaffDashboard() {
        try {
            System.out.println("📊 Fetching staff dashboard data");
            Map<String, Object> dashboardData = dashboardService.getStaffDashboardData();
            System.out.println("✅ Staff dashboard data retrieved successfully");
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            System.err.println("❌ Error fetching staff dashboard: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminDashboard() {
        try {
            System.out.println("📊 Fetching admin dashboard data");
            Map<String, Object> dashboardData = dashboardService.getAdminDashboardData();
            System.out.println("✅ Admin dashboard data retrieved successfully");
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            System.err.println("❌ Error fetching admin dashboard: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}