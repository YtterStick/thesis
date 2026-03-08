package com.starwash.authservice.repository;

import com.starwash.authservice.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Notification> findByUserIdAndReadOrderByCreatedAtDesc(String userId, boolean read);

    long countByUserIdAndRead(String userId, boolean read);
}