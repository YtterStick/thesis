package com.starwash.authservice.controller;

import com.starwash.authservice.service.DashboardService;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.MachineRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final com.starwash.authservice.service.AiService aiService;
    private final LaundryJobRepository laundryJobRepository;
    private final MachineRepository machineRepository;

    public DashboardController(DashboardService dashboardService, com.starwash.authservice.service.AiService aiService,
            LaundryJobRepository laundryJobRepository, MachineRepository machineRepository) {
        this.dashboardService = dashboardService;
        this.aiService = aiService;
        this.laundryJobRepository = laundryJobRepository;
        this.machineRepository = machineRepository;
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

    // NEW: AI Insights endpoint
    @GetMapping("/admin/ai-insights")
    public ResponseEntity<Map<String, String>> getAdminAiInsights(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            Map<String, Object> dashboardTotals = dashboardService.getAdminDashboardTotals();
            String insight = aiService.generateSalesInsights(dashboardTotals);
            return ResponseEntity.ok(Map.of("insight", insight));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // NEW: AI Scheduling endpoint
    @GetMapping("/admin/ai-scheduling")
    public ResponseEntity<Map<String, String>> getAdminAiScheduling(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<com.starwash.authservice.model.LaundryJob> recentJobs = laundryJobRepository.findAll();
            List<com.starwash.authservice.model.MachineItem> machines = machineRepository.findAll();
            String recommendation = aiService.generateSchedulingRecommendations(recentJobs, machines);
            return ResponseEntity.ok(Map.of("recommendation", recommendation));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Helper method to retrieve machine health data (reads persistent totalLoadsProcessed from MachineItem)
    private java.util.List<java.util.Map<String, Object>> getMachineHealthList() {
        List<com.starwash.authservice.model.MachineItem> allMachines = machineRepository.findAll();

        java.util.List<java.util.Map<String, Object>> results = new java.util.ArrayList<>();
        for (com.starwash.authservice.model.MachineItem machine : allMachines) {
            java.util.Map<String, Object> entry = new java.util.HashMap<>();
            long loads = machine.getTotalLoadsProcessed();
            entry.put("machineId", machine.getId());
            entry.put("machineName", machine.getName());
            entry.put("machineType", machine.getType());
            entry.put("status", machine.getStatus());
            entry.put("totalLoadsProcessed", loads);
            entry.put("lastMaintenance", machine.getLastMaintenance());
            entry.put("nextMaintenance", machine.getNextMaintenance());

            boolean neverMaintained = (machine.getLastMaintenance() == null
                    || machine.getLastMaintenance().trim().isEmpty());
            boolean needsMaintenance = loads >= 100;
            String severity = loads >= 200 ? "CRITICAL" : loads >= 100 ? "WARNING" : "OK";

            String message;
            if (needsMaintenance) {
                if (neverMaintained) {
                    message = machine.getName() + " has processed " + loads
                            + " loads but has NEVER had maintenance recorded! Immediate service recommended.";
                    severity = "CRITICAL";
                } else {
                    message = machine.getName() + " has processed " + loads
                            + " loads since last maintenance. Consider scheduling maintenance soon.";
                }
            } else {
                message = machine.getName() + " is operating normally with " + loads + " loads processed.";
            }

            entry.put("needsMaintenance", needsMaintenance);
            entry.put("severity", severity);
            entry.put("message", message);

            results.add(entry);
        }

        results.sort((a, b) -> Long.compare(
                (Long) b.get("totalLoadsProcessed"),
                (Long) a.get("totalLoadsProcessed")));

        return results;
    }

    // Machine health data endpoint (NO AI — pure data, zero tokens)
    @GetMapping("/admin/machine-health")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getMachineHealth(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            return ResponseEntity.ok(getMachineHealthList());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // AI-based machine health analysis
    @GetMapping("/admin/machine-health/ai-analysis")
    public ResponseEntity<java.util.Map<String, String>> getMachineHealthAiAnalysis(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            java.util.List<java.util.Map<String, Object>> healthData = getMachineHealthList();
            String analysis = aiService.analyzeMachineHealth(healthData);
            return ResponseEntity.ok(java.util.Map.of("analysis", analysis));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
