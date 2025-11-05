package com.starwash.authservice.repository;

import com.starwash.authservice.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    
    // Find all notifications for a user, ordered by creation date (newest first)
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    
    // Find unread notifications for a user
    List<Notification> findByUserIdAndReadOrderByCreatedAtDesc(String userId, boolean read);
    
    // Count unread notifications for a user
    long countByUserIdAndRead(String userId, boolean read);
    
    // Find notifications by type for a user
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(String userId, String type);
    
    // Find recent notifications (last N) for a user
    @Query(value = "{ 'userId': ?0 }", sort = "{ 'createdAt': -1 }")
    List<Notification> findTopByUserIdOrderByCreatedAtDesc(String userId, int limit);
    
    // Find notifications created after a certain date
    List<Notification> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(String userId, java.time.LocalDateTime date);
    
    // Delete all notifications for a user
    void deleteByUserId(String userId);
    
    // Find notifications by related entity (e.g., transaction ID)
    List<Notification> findByRelatedEntityIdOrderByCreatedAtDesc(String relatedEntityId);
    
    // Count notifications by type for a user
    long countByUserIdAndType(String userId, String type);
}