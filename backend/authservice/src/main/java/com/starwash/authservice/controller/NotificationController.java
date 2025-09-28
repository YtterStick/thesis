package com.starwash.authservice.controller;

import com.starwash.authservice.model.Notification;
import com.starwash.authservice.model.User;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.NotificationService;
import com.starwash.authservice.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
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
    public ResponseEntity<List<Notification>> getUserNotifications(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        Notification notification = notificationService.markAsRead(id);
        return notification != null ? ResponseEntity.ok(notification) : ResponseEntity.notFound().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(count);
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
                return user.get().getId(); // This returns the MongoDB ID like "68d05165bd1c24e8d7b9b170"
            } else {
                throw new SecurityException("User not found");
            }
        } catch (Exception e) {
            throw new SecurityException("Invalid token: " + e.getMessage());
        }
    }
}