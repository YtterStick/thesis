package com.starwash.authservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/")
public class DebugController {
    
    @GetMapping("/debug/auth")
    public ResponseEntity<?> debugAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> context = new HashMap<>();
        context.put("authenticated", auth != null && auth.isAuthenticated());
        context.put("name", auth != null ? auth.getName() : null);
        context.put("authorities", auth != null ? 
            auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()) : null);
        context.put("principal", auth != null ? auth.getPrincipal().getClass().getSimpleName() : null);
        context.put("details", auth != null ? auth.getDetails() : null);
        
        System.out.println("🔍 Debug Auth Request - Context: " + context);
        
        return ResponseEntity.ok(context);
    }
    
    @GetMapping("/debug/dashboard-test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> testDashboardAccess() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "✅ Dashboard access granted!");
        response.put("user", auth.getName());
        response.put("authorities", auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        
        System.out.println("✅ Dashboard test accessed by: " + auth.getName() + " with authorities: " + auth.getAuthorities());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/debug/public-test")
    public ResponseEntity<?> publicTest() {
        return ResponseEntity.ok("✅ Public endpoint works!");
    }
    
    @GetMapping("/debug/authenticated-test")
    public ResponseEntity<?> authenticatedTest(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "✅ Authenticated endpoint works!");
        response.put("user", authentication.getName());
        response.put("authorities", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }
}

@RestController
@RequestMapping("/test")
class TestController {
    
    @GetMapping("/security-context")
    public ResponseEntity<?> getSecurityContext() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> context = new HashMap<>();
        context.put("authenticated", auth != null && auth.isAuthenticated());
        context.put("name", auth != null ? auth.getName() : null);
        context.put("authorities", auth != null ? 
            auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()) : null);
        context.put("principal", auth != null ? auth.getPrincipal().getClass().getSimpleName() : null);
        
        System.out.println("🔍 Test Security Context: " + context);
        
        return ResponseEntity.ok(context);
    }
    
    @GetMapping("/admin-test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminTest() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "✅ Admin access granted!");
        response.put("user", auth.getName());
        response.put("authorities", auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        
        System.out.println("✅ Admin test accessed by: " + auth.getName());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/staff-test")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<?> staffTest() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "✅ Staff access granted!");
        response.put("user", auth.getName());
        response.put("authorities", auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/any-authenticated")
    public ResponseEntity<?> anyAuthenticated(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "✅ Any authenticated user can access this!");
        response.put("user", authentication.getName());
        response.put("authorities", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }
}
