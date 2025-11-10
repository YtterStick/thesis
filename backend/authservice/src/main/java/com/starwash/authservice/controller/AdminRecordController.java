// AdminRecordController.java
package com.starwash.authservice.controller;

import com.starwash.authservice.dto.AdminRecordResponseDto;
import com.starwash.authservice.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminRecordController {

    private final TransactionService transactionService;

    public AdminRecordController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // ✅ GET /api/admin/records — returns all transaction records with admin fields
    @GetMapping("/records")
    public ResponseEntity<List<AdminRecordResponseDto>> getAllAdminRecords(
            @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        List<AdminRecordResponseDto> records = transactionService.getAllAdminRecords();
        return ResponseEntity.ok(records);
    }
}