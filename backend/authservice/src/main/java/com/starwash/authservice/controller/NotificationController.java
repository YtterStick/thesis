package com.starwash.authservice.controller;

import com.starwash.authservice.model.Notification;
import com.starwash.authservice.model.User;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.NotificationService;
import com.starwash.authservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, JwtUtil jwtUtil,
            UserRepository userRepository) {
        this.notificationService = notificationService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getUserNotifications(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {

        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Pageable pageable = PageRequest.of(page, limit);
            Page<Notification> notificationsPage = notificationService.getUserNotifications(userId, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("notifications", notificationsPage.getContent());
            response.put("hasMore", notificationsPage.hasNext());
            response.put("total", notificationsPage.getTotalElements());
            response.put("totalPages", notificationsPage.getTotalPages());
            response.put("page", notificationsPage.getNumber());
            response.put("limit", notificationsPage.getSize());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {
                {
                    put("error", "Failed to fetch notifications");
                    put("message", e.getMessage());
                }
            });
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        try {
            Notification notification = notificationService.markAsRead(id);
            return notification != null ? ResponseEntity.ok(notification) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {
                {
                    put("error", "Failed to mark notification as read");
                    put("message", e.getMessage());
                }
            });
        }
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {
                {
                    put("error", "Invalid token");
                }
            });
        }
        try {
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {
                {
                    put("error", "Failed to mark all notifications as read");
                    put("message", e.getMessage());
                }
            });
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {
                {
                    put("error", "Invalid token");
                }
            });
        }
        try {
            long count = notificationService.getUnreadCount(userId);
            // Return as simple number for backward compatibility
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {
                {
                    put("error", "Failed to get unread count");
                    put("message", e.getMessage());
                }
            });
        }
    }

    @PostMapping("/trigger-stock-check")
    public ResponseEntity<?> triggerStockCheck() {
        try {
            notificationService.triggerStockCheck();
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new HashMap<String, String>() {
                {
                    put("error", "Failed to trigger stock check");
                    put("message", e.getMessage());
                }
            });
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