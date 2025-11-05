// Notification Repository
package com.starwash.authservice.repository;

import com.starwash.authservice.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserIdAndReadOrderByCreatedAtDesc(String userId, boolean read);
    long countByUserIdAndRead(String userId, boolean read);
}