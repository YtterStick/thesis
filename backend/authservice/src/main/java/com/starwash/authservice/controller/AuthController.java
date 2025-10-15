package com.starwash.authservice.controller;

import com.starwash.authservice.model.User;
import com.starwash.authservice.repository.UserRepository;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.AuditService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User registerRequest, HttpServletRequest request) {
        System.out.println("📝 Registering new user: " + registerRequest.getUsername());

        // Check if username already exists
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Collections.singletonMap("error", "Username already exists"));
        }

        // Password validation
        String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
        if (!registerRequest.getPassword().matches(passwordRegex)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("error",
                            "Password must be at least 8 characters, contain uppercase, lowercase, number and special character (@$!%*?&)"));
        }

        // Encode password and set default values
        registerRequest.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        if (registerRequest.getRole() == null || registerRequest.getRole().isEmpty()) {
            registerRequest.setRole("STAFF");
        }

        if (registerRequest.getStatus() == null || registerRequest.getStatus().isEmpty()) {
            registerRequest.setStatus("Active");
        }

        // Save user
        User savedUser = userRepository.save(registerRequest);
        
        // Log user registration
        auditService.logActivity(
            "system",
            "CREATE",
            savedUser.getRole().toUpperCase(), // Use actual role (ADMIN/STAFF)
            savedUser.getId(),
            "New user registered: " + savedUser.getUsername() + " with role: " + savedUser.getRole(),
            request
        );
        
        System.out.println("✅ User registered: " + savedUser.getUsername());

        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest, HttpServletRequest request) {
        Optional<User> foundUser = userRepository.findByUsername(loginRequest.getUsername());

        if (foundUser.isPresent()) {
            User user = foundUser.get();
            
            // Check if account is inactive
            if ("Inactive".equals(user.getStatus())) {
                // Log failed login attempt due to inactive account
                auditService.logActivity(
                    loginRequest.getUsername(),
                    "LOGIN",
                    user.getRole().toUpperCase(), // Use actual role
                    user.getId(),
                    "Failed login attempt - Account is deactivated",
                    request
                );
                
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("error", "Account is deactivated"));
            }
            
            boolean matches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());

            if (matches) {
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                
                // Log successful login
                auditService.logActivity(
                    user.getUsername(),
                    "LOGIN",
                    user.getRole().toUpperCase(), // Use actual role
                    user.getId(),
                    "User logged in successfully",
                    request
                );
                
                return ResponseEntity.ok(Collections.singletonMap("token", token));
            } else {
                // Log failed login attempt due to invalid password
                auditService.logActivity(
                    loginRequest.getUsername(),
                    "LOGIN",
                    "UNKNOWN", // Role unknown for failed login
                    null,
                    "Failed login attempt - Invalid password",
                    request
                );
            }
        } else {
            // Log failed login attempt due to non-existent user
            auditService.logActivity(
                loginRequest.getUsername(),
                "LOGIN",
                "UNKNOWN", // Role unknown for failed login
                null,
                "Failed login attempt - User not found",
                request
            );
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("error", "Invalid credentials"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                   HttpServletRequest request) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("error", "Missing or invalid token"));
        }

        String token = authHeader.replace("Bearer ", "");

        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Invalid token"));
        }

        String username = jwtUtil.getUsername(token);
        String role = jwtUtil.getRole(token);
        
        // Log logout activity
        auditService.logActivity(
            username,
            "LOGOUT",
            role.toUpperCase(), // Use role from token
            null,
            "User logged out successfully",
            request
        );
        
        System.out.println("👋 Logout for: " + username);

        return ResponseEntity.ok(Collections.singletonMap("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Missing or invalid token"));
        }

        String token = authHeader.replace("Bearer ", "");

        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Invalid or expired token"));
        }

        String username = jwtUtil.getUsername(token);
        String role = jwtUtil.getRole(token);

        return ResponseEntity.ok(Map.of("user", username, "role", role));
    }
    
}
