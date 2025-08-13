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
    public ResponseEntity<?> saveSettings(@RequestBody InvoiceSettings settings,
                                          @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized");
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
        return settings.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.status(404).build());
    }

    private boolean isAuthorized(String authHeader) {
        return authHeader != null && authHeader.startsWith("Bearer ") &&
               jwtUtil.validateToken(authHeader.replace("Bearer ", ""));
    }
}