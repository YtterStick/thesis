package com.starwash.authservice.controller;

import com.starwash.authservice.model.Notification;
import com.starwash.authservice.model.User;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.NotificationService;
import com.starwash.authservice.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {
    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    
    // Store active SSE emitters for real-time notifications
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public NotificationController(NotificationService notificationService, JwtUtil jwtUtil, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getUserNotifications(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int limit) {
        
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid token"));
        }
        
        try {
            List<Notification> notifications = notificationService.getUserNotifications(userId);
            
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
            response.put("unreadCount", notificationService.getUnreadCount(userId));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Failed to fetch notifications: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, @RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid token"));
        }
        
        try {
            Notification notification = notificationService.markAsRead(id);
            if (notification != null) {
                // Notify all emitters about the read status change
                notifyEmitters("notification_read", notification);
                return ResponseEntity.ok(notification);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Failed to mark notification as read: " + e.getMessage()));
        }
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid token"));
        }
        try {
            notificationService.markAllAsRead(userId);
            
            // Notify all emitters about bulk read
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("type", "all_read");
            eventData.put("userId", userId);
            notifyEmitters("all_notifications_read", eventData);
            
            return ResponseEntity.ok().body(createSuccessResponse("All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Failed to mark all notifications as read: " + e.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid token"));
        }
        try {
            long count = notificationService.getUnreadCount(userId);
            // Return as simple number for backward compatibility
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Failed to get unread count: " + e.getMessage()));
        }
    }

    @PostMapping("/trigger-stock-check")
    public ResponseEntity<?> triggerStockCheck() {
        try {
            notificationService.triggerStockCheck();
            return ResponseEntity.ok().body(createSuccessResponse("Stock check triggered successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Failed to trigger stock check: " + e.getMessage()));
        }
    }

    // 🔄 REAL-TIME NOTIFICATION STREAM
    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter streamNotifications(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            throw new RuntimeException("Invalid token");
        }
        
        SseEmitter emitter = new SseEmitter(3600000L); // 1 hour timeout
        emitters.add(emitter);
        
        // Send initial connection event
        try {
            Map<String, Object> initialEvent = new HashMap<>();
            initialEvent.put("type", "connected");
            initialEvent.put("message", "Real-time notifications connected");
            initialEvent.put("timestamp", System.currentTimeMillis());
            emitter.send(SseEmitter.event().name("connected").data(initialEvent));
        } catch (Exception e) {
            System.err.println("Error sending initial connection event: " + e.getMessage());
        }
        
        // Handle completion and timeout
        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            System.out.println("SSE connection completed for user: " + userId);
        });
        
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            System.out.println("SSE connection timeout for user: " + userId);
        });
        
        emitter.onError((e) -> {
            emitters.remove(emitter);
            System.err.println("SSE connection error for user: " + userId + ": " + e.getMessage());
        });
        
        return emitter;
    }

    // 🔔 BROADCAST NOTIFICATION TO ALL CONNECTED CLIENTS
    public void broadcastNotification(Notification notification) {
        System.out.println("📢 Broadcasting notification to " + emitters.size() + " connected clients: " + notification.getTitle());
        
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        
        emitters.forEach(emitter -> {
            try {
                Map<String, Object> eventData = new HashMap<>();
                eventData.put("type", "new_notification");
                eventData.put("notification", notification);
                eventData.put("timestamp", System.currentTimeMillis());
                
                emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(eventData));
                
                System.out.println("✅ Notification sent to client: " + notification.getTitle());
            } catch (Exception e) {
                deadEmitters.add(emitter);
                System.err.println("❌ Error sending notification to client: " + e.getMessage());
            }
        });
        
        // Remove dead emitters
        emitters.removeAll(deadEmitters);
    }

    // 🔄 NOTIFY EMMITERS ABOUT EVENTS
    private void notifyEmitters(String eventName, Object data) {
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        
        emitters.forEach(emitter -> {
            try {
                Map<String, Object> eventData = new HashMap<>();
                eventData.put("type", eventName);
                eventData.put("data", data);
                eventData.put("timestamp", System.currentTimeMillis());
                
                emitter.send(SseEmitter.event()
                    .name("notification_update")
                    .data(eventData));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        });
        
        emitters.removeAll(deadEmitters);
    }

    // 🆕 GET RECENT NOTIFICATIONS
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentNotifications(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "5") int limit) {
        
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid token"));
        }
        
        try {
            List<Notification> allNotifications = notificationService.getUserNotifications(userId);
            List<Notification> recentNotifications = allNotifications.stream()
                    .limit(limit)
                    .toList();
            
            return ResponseEntity.ok(recentNotifications);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Failed to fetch recent notifications: " + e.getMessage()));
        }
    }

    // 🆕 GET NOTIFICATION STATISTICS
    @GetMapping("/stats")
    public ResponseEntity<?> getNotificationStats(@RequestHeader("Authorization") String token) {
        String userId = getUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Invalid token"));
        }
        
        try {
            List<Notification> allNotifications = notificationService.getUserNotifications(userId);
            long totalCount = allNotifications.size();
            long unreadCount = notificationService.getUnreadCount(userId);
            long readCount = totalCount - unreadCount;
            
            // Count by type
            Map<String, Long> typeCounts = allNotifications.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                        Notification::getType,
                        java.util.stream.Collectors.counting()
                    ));
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("total", totalCount);
            stats.put("unread", unreadCount);
            stats.put("read", readCount);
            stats.put("typeCounts", typeCounts);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Failed to fetch notification stats: " + e.getMessage()));
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

    private Map<String, String> createErrorResponse(String error) {
        Map<String, String> response = new HashMap<>();
        response.put("error", error);
        return response;
    }
    
    private Map<String, String> createSuccessResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        return response;
    }
}