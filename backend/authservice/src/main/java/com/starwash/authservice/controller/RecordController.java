package com.starwash.authservice.controller;

import com.starwash.authservice.dto.RecordResponseDto;
import com.starwash.authservice.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map; // Add this import

@RestController
@RequestMapping("")
public class RecordController {

    private final TransactionService transactionService;

    public RecordController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // ✅ GET /api/records — returns all transaction records
    @GetMapping("/records")
    public ResponseEntity<List<RecordResponseDto>> getAllRecords() {
        List<RecordResponseDto> records = transactionService.getAllRecords();
        return ResponseEntity.ok(records);
    }

    // ✅ GET /api/records/staff — returns filtered records for staff
    @GetMapping("/records/staff")
    public ResponseEntity<List<RecordResponseDto>> getStaffRecords() {
        List<RecordResponseDto> records = transactionService.getStaffRecords();
        return ResponseEntity.ok(records);
    }

    // ✅ GET /api/records/staff/summary — returns summary data for staff
    @GetMapping("/records/staff/summary")
    public ResponseEntity<Map<String, Object>> getStaffRecordsSummary() {
        Map<String, Object> summary = transactionService.getStaffRecordsSummary();
        return ResponseEntity.ok(summary);
    }
}