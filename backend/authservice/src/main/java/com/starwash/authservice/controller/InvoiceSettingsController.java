package com.starwash.authservice.controller;

import com.starwash.authservice.model.InvoiceSettings;
import com.starwash.authservice.repository.InvoiceSettingsRepository;
import com.starwash.authservice.security.JwtUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/invoice-settings")
@CrossOrigin(origins = "http://localhost:3000")
public class InvoiceSettingsController {

    private final InvoiceSettingsRepository repository;
    private final JwtUtil jwtUtil;

    public InvoiceSettingsController(InvoiceSettingsRepository repository, JwtUtil jwtUtil) {
        this.repository = repository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<?> saveSettings(@RequestBody InvoiceSettings incoming,
            @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<InvoiceSettings> existingOpt = repository.findTopByOrderByIdDesc();

        InvoiceSettings settings;
        if (existingOpt.isPresent()) {
            settings = existingOpt.get();
            settings.setStoreName(incoming.getStoreName());
            settings.setAddress(incoming.getAddress());
            settings.setPhone(incoming.getPhone());
            settings.setFooterNote(incoming.getFooterNote());
            settings.setTrackingUrl(incoming.getTrackingUrl());
        } else {
            settings = incoming;
        }

        repository.save(settings);
        return ResponseEntity.ok("Saved");
    }

    @GetMapping
    public ResponseEntity<?> getSettings(@RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<InvoiceSettings> settings = repository.findTopByOrderByIdDesc();

        if (settings.isPresent()) {
            return ResponseEntity.ok(settings.get());
        } else {
            return ResponseEntity.status(404).body("No settings found");
        }
    }

    private boolean isAuthorized(String authHeader) {
        return authHeader != null &&
                authHeader.startsWith("Bearer ") &&
                jwtUtil.validateToken(authHeader.replace("Bearer ", ""));
    }
}