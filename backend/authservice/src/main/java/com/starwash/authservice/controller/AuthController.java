package com.starwash.authservice.controller;

import com.starwash.authservice.model.User;
import com.starwash.authservice.repository.UserRepository;
import com.starwash.authservice.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User registerRequest) {
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
        System.out.println("✅ User registered: " + savedUser.getUsername());

        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> foundUser = userRepository.findByUsername(loginRequest.getUsername());

        if (foundUser.isPresent()) {
            User user = foundUser.get();
            
            // Check if account is inactive
            if ("Inactive".equals(user.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("error", "Account is deactivated"));
            }
            
            boolean matches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());

            if (matches) {
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                return ResponseEntity.ok(Collections.singletonMap("token", token));
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("error", "Invalid credentials"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
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