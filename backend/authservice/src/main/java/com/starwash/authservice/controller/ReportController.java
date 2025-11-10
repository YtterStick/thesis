package com.starwash.authservice.controller;

import com.starwash.authservice.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "http://localhost:3000")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    public ResponseEntity<Map<String, Object>> getSalesReport(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String dateRange,
            @RequestParam(required = false) @DateTimeFormat(pattern = "MM/dd/yyyy") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "MM/dd/yyyy") LocalDate endDate,
            @RequestParam(required = false) String serviceType) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            Map<String, Object> reportData = reportService.generateSalesReport(dateRange, startDate, endDate,
                    serviceType);
            return ResponseEntity.ok(reportData);
        } catch (IllegalArgumentException e) {
            // Return 400 for validation errors
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // Log the exception for debugging
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}