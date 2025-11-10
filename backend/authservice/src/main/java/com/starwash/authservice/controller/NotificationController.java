package com.starwash.authservice.controller;

import com.starwash.authservice.model.Notification;
import com.starwash.authservice.model.User;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.NotificationService;
import com.starwash.authservice.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, JwtUtil jwtUtil, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getUserNotifications(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            List<Notification> notifications = notificationService.getUserNotifications(userId);
            
            // For backward compatibility, check if pagination parameters are provided
            if (page > 1 || limit != 10) {
                // Apply pagination
                int skip = (page - 1) * limit;
                int total = notifications.size();
                int start = Math.min(skip, total);
                int end = Math.min(skip + limit, total);
                boolean hasMore = end < total;
                
                List<Notification> paginatedNotifications = notifications.subList(start, end);
                
                Map<String, Object> response = new HashMap<>();
                response.put("notifications", paginatedNotifications);
                response.put("hasMore", hasMore);
                response.put("total", total);
                response.put("page", page);
                response.put("limit", limit);
                
                return ResponseEntity.ok(response);
            } else {
                // Return plain array for backward compatibility
                return ResponseEntity.ok(notifications);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {{
                put("error", "Failed to fetch notifications");
                put("message", e.getMessage());
            }});
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        try {
            Notification notification = notificationService.markAsRead(id);
            return notification != null ? ResponseEntity.ok(notification) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {{
                put("error", "Failed to mark notification as read");
                put("message", e.getMessage());
            }});
        }
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {{
                put("error", "Invalid token");
            }});
        }
        try {
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {{
                put("error", "Failed to mark all notifications as read");
                put("message", e.getMessage());
            }});
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {{
                put("error", "Invalid token");
            }});
        }
        try {
            long count = notificationService.getUnreadCount(userId);
            // Return as simple number for backward compatibility
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {{
                put("error", "Failed to get unread count");
                put("message", e.getMessage());
            }});
        }
    }

    @PostMapping("/trigger-stock-check")
    public ResponseEntity<?> triggerStockCheck() {
        try {
            notificationService.triggerStockCheck();
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {{
                put("error", "Failed to trigger stock check");
                put("message", e.getMessage());
            }});
        }
    }

    private String getUserIdFromToken(String token) {
        try {
            String cleanToken = token.replace("Bearer ", "");
            if (!jwtUtil.validateToken(cleanToken)) {
                throw new SecurityException("Invalid or expired token");
            }
            
            String username = jwtUtil.extractUsername(cleanToken);
            Optional<User> user = userRepository.findByUsername(username);
            
            if (user.isPresent()) {
                return user.get().getId();
            } else {
                throw new SecurityException("User not found");
            }
        } catch (Exception e) {
            throw new SecurityException("Invalid token: " + e.getMessage());
        }
    }
}