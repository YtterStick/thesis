package com.starwash.authservice.controller;

import com.starwash.authservice.dto.ReceiptSettingsDto;
import com.starwash.authservice.model.ReceiptSettings;
import com.starwash.authservice.repository.ReceiptSettingsRepository;
import com.starwash.authservice.security.JwtUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/receipt-settings")
@CrossOrigin(origins = "http://localhost:3000")
public class ReceiptSettingsController {

    private final ReceiptSettingsRepository repository;
    private final JwtUtil jwtUtil;

    public ReceiptSettingsController(ReceiptSettingsRepository repository, JwtUtil jwtUtil) {
        this.repository = repository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<String> saveSettings(@RequestBody ReceiptSettingsDto dto,
                                               @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        ReceiptSettings settings = new ReceiptSettings(dto);
        repository.save(settings);
        return ResponseEntity.ok("Saved");
    }

    @GetMapping
    public ResponseEntity<?> getSettings(@RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<ReceiptSettings> settings = repository.findTopByOrderByIdDesc();

        if (settings.isPresent()) {
            ReceiptSettingsDto dto = new ReceiptSettingsDto(settings.get());
            return ResponseEntity.ok(dto);
        } else {
            return ResponseEntity.status(404).body("No settings found");
        }
    }

    // 🔐 Token validation helper
    private boolean isAuthorized(String authHeader) {
        return authHeader != null &&
               authHeader.startsWith("Bearer ") &&
               jwtUtil.validateToken(authHeader.replace("Bearer ", ""));
    }
}   