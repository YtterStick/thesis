package com.starwash.authservice.controller;

import com.starwash.authservice.dto.FormatSettingsDto;
import com.starwash.authservice.model.FormatSettings;
import com.starwash.authservice.repository.FormatSettingsRepository;
import com.starwash.authservice.security.JwtUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/format-settings")
@CrossOrigin(origins = "http://localhost:3000")
public class FormatSettingsController {

    private final FormatSettingsRepository repository;
    private final JwtUtil jwtUtil;

    public FormatSettingsController(FormatSettingsRepository repository, JwtUtil jwtUtil) {
        this.repository = repository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<String> saveSettings(@RequestBody FormatSettingsDto dto,
                                               @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        FormatSettings settings = repository.findTopByOrderByIdDesc()
                .orElse(new FormatSettings());
        settings.setStoreName(dto.getStoreName());
        settings.setAddress(dto.getAddress());
        settings.setPhone(dto.getPhone());
        settings.setFooterNote(dto.getFooterNote());
        settings.setTrackingUrl(dto.getTrackingUrl());

        repository.save(settings);
        return ResponseEntity.ok("Saved");
    }

    @GetMapping
    public ResponseEntity<FormatSettingsDto> getSettings(@RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) {
            return ResponseEntity.status(401).build();
        }

        return repository.findTopByOrderByIdDesc()
                .map(s -> ResponseEntity.ok(new FormatSettingsDto(s)))
                .orElse(ResponseEntity.status(404).build());
    }

    private boolean isAuthorized(String authHeader) {
        return authHeader != null &&
               authHeader.startsWith("Bearer ") &&
               jwtUtil.validateToken(authHeader.replace("Bearer ", ""));
    }
}