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
@CrossOrigin(origins = "http://localhost:3000") // ✅ Allow frontend access from dev server
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 🔐 Login: verify credentials & issue JWT
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        System.out.println("📥 Login attempt: " + loginRequest.getUsername());

        Optional<User> foundUser = userRepository.findByUsername(loginRequest.getUsername());

        if (foundUser.isPresent()) {
            User user = foundUser.get();
            boolean matches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());

            if (matches) {
                String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
                System.out.println("✅ Credentials valid. Issued token for " + user.getUsername());
                return ResponseEntity.ok(Collections.singletonMap("token", token));
            } else {
                System.out.println("❌ Password mismatch for user: " + user.getUsername());
            }
        } else {
            System.out.println("❌ No matching user found: " + loginRequest.getUsername());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Collections.singletonMap("error", "Invalid credentials"));
    }

    // 🔎 /me: decode JWT and return user + role
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        System.out.println("📡 Incoming /me request. Header: " + authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("❌ Missing or malformed Authorization header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("error", "Missing or invalid token"));
        }

        String token = authHeader.replace("Bearer ", "");

        if (!jwtUtil.validateToken(token)) {
            System.out.println("❌ JWT failed validation: " + token);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("error", "Invalid or expired token"));
        }

        String username = jwtUtil.getUsername(token);
        String role = jwtUtil.getRole(token);

        System.out.println("👤 /me resolved. User: " + username + ", Role: " + role);

        return ResponseEntity.ok(Map.of(
            "user", username,
            "role", role
        ));
    }
}