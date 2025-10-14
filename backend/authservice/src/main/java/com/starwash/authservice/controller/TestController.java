package com.starwash.authservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {
    
    @GetMapping("/security-context")
    public ResponseEntity<?> getSecurityContext() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> context = new HashMap<>();
        context.put("authenticated", auth != null && auth.isAuthenticated());
        context.put("name", auth != null ? auth.getName() : null);
        context.put("authorities", auth != null ? auth.getAuthorities().toString() : null);
        context.put("principal", auth != null ? auth.getPrincipal() : null);
        
        return ResponseEntity.ok(context);
    }
    
    @GetMapping("/admin-test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminTest() {
        return ResponseEntity.ok("✅ Admin access granted!");
    }
}