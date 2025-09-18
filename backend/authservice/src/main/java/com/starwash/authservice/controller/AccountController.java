package com.starwash.authservice.controller;

import com.starwash.authservice.model.User;
import com.starwash.authservice.repository.UserRepository;
import com.starwash.authservice.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class AccountController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AccountController(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    // ✅ Fetch all accounts with sanitized response
    @GetMapping("/accounts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAccounts() {
        try {
            List<User> users = userRepository.findAll();
            if (users.isEmpty()) {
                return ResponseEntity.ok("No user accounts found.");
            }

            List<UserResponse> response = users.stream()
                    .map(user -> new UserResponse(
                            user.getId(),
                            user.getUsername(),
                            user.getRole(),
                            user.getContact(),
                            user.getStatus()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("🚫 Error fetching users: " + e.getMessage());
        }
    }

    // ✅ Create account and return DTO
    @PostMapping("/accounts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAccount(@RequestBody User newUser) {
        try {
            // Password validation
            String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
            if (!newUser.getPassword().matches(passwordRegex)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error",
                                "Password must be at least 8 characters, contain uppercase, lowercase, number and special character (@$!%*?&)"));
            }

            // Encode password before saving
            newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
            User savedUser = userRepository.save(newUser);
            
            System.out.println("✅ New account created: " + savedUser.getUsername());
            UserResponse dto = new UserResponse(
                    savedUser.getId(),
                    savedUser.getUsername(),
                    savedUser.getRole(),
                    savedUser.getContact(),
                    savedUser.getStatus());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("🚫 Error creating user: " + e.getMessage());
        }
    }

    // ✅ Get account by ID
    @GetMapping("/accounts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAccountById(@PathVariable String id) {
        Optional<User> userOpt = userRepository.findById(id);
        return userOpt
                .<ResponseEntity<?>>map(
                        user -> ResponseEntity.ok(new UserResponse(
                                user.getId(),
                                user.getUsername(),
                                user.getRole(),
                                user.getContact(),
                                user.getStatus())))
                .orElseGet(() -> ResponseEntity.status(404).body("🚫 Account not found for ID: " + id));
    }

    // ✅ Update account
    @PatchMapping("/accounts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAccount(@PathVariable String id, @RequestBody Map<String, String> updateRequest) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Account not found"));
            }

            User user = userOpt.get();
            
            // Update password if provided
            if (updateRequest.containsKey("password") && !updateRequest.get("password").isEmpty()) {
                String password = updateRequest.get("password");
                // Validate password
                String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
                if (!password.matches(passwordRegex)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error",
                                    "Password must be at least 8 characters, contain uppercase, lowercase, number and special character (@$!%*?&)"));
                }
                user.setPassword(passwordEncoder.encode(password));
            }

            if (updateRequest.containsKey("contact")) {
                user.setContact(updateRequest.get("contact"));
            }

            if (updateRequest.containsKey("role")) {
                user.setRole(updateRequest.get("role"));
            }

            userRepository.save(user);

            return ResponseEntity.ok(new UserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getRole(),
                    user.getContact(),
                    user.getStatus()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error updating account: " + e.getMessage()));
        }
    }

    // ✅ Update account status
    @PatchMapping("/accounts/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAccountStatus(@PathVariable String id,
            @RequestBody Map<String, String> statusUpdate) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Account not found"));
            }

            User user = userOpt.get();
            String newStatus = statusUpdate.get("status");

            if (!"Active".equals(newStatus) && !"Inactive".equals(newStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Status must be 'Active' or 'Inactive'"));
            }

            user.setStatus(newStatus);
            userRepository.save(user);

            return ResponseEntity.ok(new UserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getRole(),
                    user.getContact(),
                    user.getStatus()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error updating account status: " + e.getMessage()));
        }
    }

    // 🔎 Debug current user's role
    @GetMapping("/debug/roles")
    public ResponseEntity<?> getCurrentUserRoles(org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(authentication.getAuthorities());
    }

    // 🕒 Debug token timestamps
    @GetMapping("/debug/token")
    public ResponseEntity<?> debugToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("🚫 Missing or invalid token");
        }

        String token = authHeader.replace("Bearer ", "");

        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("🚫 Invalid or expired token");
        }

        String username = jwtUtil.getUsername(token);
        Date issuedAt = jwtUtil.getIssuedAt(token);
        Date expiresAt = jwtUtil.getExpiration(token);

        System.out.println("🔍 Token introspection for: " + username);
        System.out.println("🕒 Issued at: " + issuedAt);
        System.out.println("⏳ Expires at: " + expiresAt);

        return ResponseEntity.ok(
                String.format("🧾 Token for %s\n🕒 Issued at: %s\n⏳ Expires at: %s",
                        username,
                        issuedAt.toString(),
                        expiresAt.toString()));
    }

    // 🧱 Internal DTO class to hide sensitive fields
    private record UserResponse(String id, String username, String role, String contact, String status) {
    }
}