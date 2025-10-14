package com.starwash.authservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
    
    @GetMapping("/api/health")  
    public String apiHealth() {
        return "OK";
    }
    
    @GetMapping("/")
    public String root() {
        return "Starwash Backend is running!";
    }
}