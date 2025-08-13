package com.starwash.authservice.controller;

import com.starwash.authservice.dto.TransactionRequestDto;
import com.starwash.authservice.dto.TransactionResponseDto;
import com.starwash.authservice.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<TransactionResponseDto> createTransaction(@RequestBody TransactionRequestDto request) {
        try {
            TransactionResponseDto response = transactionService.createTransaction(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("Transaction creation failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponseDto> getTransactionById(@PathVariable String id) {
        try {
            TransactionResponseDto response = transactionService.getTransactionById(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}