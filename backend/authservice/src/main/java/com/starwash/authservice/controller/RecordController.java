package com.starwash.authservice.controller;

import com.starwash.authservice.dto.RecordResponseDto;
import com.starwash.authservice.service.TransactionService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
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
}