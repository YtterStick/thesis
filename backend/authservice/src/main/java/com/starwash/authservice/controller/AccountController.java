package com.starwash.authservice.controller;

import com.starwash.authservice.model.User;
import com.starwash.authservice.repository.UserRepository;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.AuditService;
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
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class AccountController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Autowired
    public AccountController(UserRepository userRepository, JwtUtil jwtUtil, 
                           PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    // ✅ Fetch all accounts with sanitized response
    @GetMapping("/accounts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAccounts(HttpServletRequest request) {
        try {
            // Extract current user from token for audit
            String currentUser = getCurrentUsername(request);
            String currentUserRole = getCurrentUserRole(request);
            
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
    public ResponseEntity<?> createAccount(@RequestBody User newUser, HttpServletRequest request) {
        try {
            // Extract current user from token for audit
            String currentUser = getCurrentUsername(request);
            String currentUserRole = getCurrentUserRole(request);

            // Password validation
            String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
            if (!newUser.getPassword().matches(passwordRegex)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error",
                                "Password must be at least 8 characters, contain uppercase, lowercase, number and special character (@$!%*?&)"));
            }

            // Check if username already exists
            if (userRepository.findByUsername(newUser.getUsername()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Username already exists"));
            }

            // Encode password before saving
            newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
            User savedUser = userRepository.save(newUser);
            
            // Log account creation
            auditService.logActivity(
                currentUser,
                "CREATE",
                currentUserRole, // Use current user's role (ADMIN)
                savedUser.getId(),
                "Created new user account: " + savedUser.getUsername() + " with role: " + savedUser.getRole(),
                request
            );
            
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
    public ResponseEntity<?> getAccountById(@PathVariable String id, HttpServletRequest request) {
        Optional<User> userOpt = userRepository.findById(id);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity.ok(new UserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getRole(),
                    user.getContact(),
                    user.getStatus()));
        } else {
            return ResponseEntity.status(404).body("🚫 Account not found for ID: " + id);
        }
    }

    // ✅ Update account
    @PatchMapping("/accounts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAccount(@PathVariable String id, @RequestBody Map<String, String> updateRequest,
                                         HttpServletRequest request) {
        try {
            // Extract current user from token for audit
            String currentUser = getCurrentUsername(request);
            String currentUserRole = getCurrentUserRole(request);

            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                // Log failed update attempt
                auditService.logActivity(
                    currentUser,
                    "UPDATE",
                    currentUserRole,
                    id,
                    "Attempted to update non-existent user account with ID: " + id,
                    request
                );
                
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Account not found"));
            }

            User user = userOpt.get();
            
            // Store old values for audit
            Map<String, Object> oldValues = Map.of(
                "username", user.getUsername(),
                "role", user.getRole(),
                "contact", user.getContact(),
                "status", user.getStatus()
            );
            
            boolean changesMade = false;
            StringBuilder changesDescription = new StringBuilder();
            
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
                changesMade = true;
                changesDescription.append("Password updated. ");
            }

            if (updateRequest.containsKey("contact")) {
                String newContact = updateRequest.get("contact");
                if (!newContact.equals(user.getContact())) {
                    changesDescription.append("Contact changed from '").append(user.getContact())
                                    .append("' to '").append(newContact).append("'. ");
                    user.setContact(newContact);
                    changesMade = true;
                }
            }

            if (updateRequest.containsKey("role")) {
                String newRole = updateRequest.get("role");
                if (!newRole.equals(user.getRole())) {
                    changesDescription.append("Role changed from '").append(user.getRole())
                                    .append("' to '").append(newRole).append("'. ");
                    user.setRole(newRole);
                    changesMade = true;
                }
            }

            if (!changesMade) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "No valid changes provided"));
            }

            userRepository.save(user);

            // Store new values for audit
            Map<String, Object> newValues = Map.of(
                "username", user.getUsername(),
                "role", user.getRole(),
                "contact", user.getContact(),
                "status", user.getStatus()
            );

            // Log account update
            auditService.logActivity(
                currentUser,
                "UPDATE",
                currentUserRole,
                user.getId(),
                "Updated user account: " + user.getUsername() + " - " + changesDescription.toString(),
                oldValues,
                newValues,
                request
            );

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
            @RequestBody Map<String, String> statusUpdate, HttpServletRequest request) {
        try {
            // Extract current user from token for audit
            String currentUser = getCurrentUsername(request);
            String currentUserRole = getCurrentUserRole(request);

            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                // Log failed status update attempt
                auditService.logActivity(
                    currentUser,
                    "UPDATE",
                    currentUserRole,
                    id,
                    "Attempted to update status for non-existent user account with ID: " + id,
                    request
                );
                
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Account not found"));
            }

            User user = userOpt.get();
            String oldStatus = user.getStatus();
            String newStatus = statusUpdate.get("status");

            if (!"Active".equals(newStatus) && !"Inactive".equals(newStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Status must be 'Active' or 'Inactive'"));
            }

            if (newStatus.equals(oldStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Account is already " + newStatus));
            }

            user.setStatus(newStatus);
            userRepository.save(user);

            // Log status change
            auditService.logActivity(
                currentUser,
                "UPDATE",
                currentUserRole,
                user.getId(),
                "Changed user status from '" + oldStatus + "' to '" + newStatus + "' for user: " + user.getUsername(),
                Map.of("status", oldStatus),
                Map.of("status", newStatus),
                request
            );

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

    // Helper method to extract current username from request
    private String getCurrentUsername(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            if (jwtUtil.validateToken(token)) {
                return jwtUtil.getUsername(token);
            }
        }
        return "system";
    }

    // Helper method to extract current user role from request
    private String getCurrentUserRole(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            if (jwtUtil.validateToken(token)) {
                return jwtUtil.getRole(token).toUpperCase();
            }
        }
        return "ADMIN"; // Default to ADMIN since only admins can access these endpoints
    }

    // 🧱 Internal DTO class to hide sensitive fields
    private record UserResponse(String id, String username, String role, String contact, String status) {
    }
}