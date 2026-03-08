// AuditLogRepository.java
package com.starwash.authservice.repository;

import com.starwash.authservice.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    Page<AuditLog> findByUsernameOrderByTimestampDesc(String username, Pageable pageable);

    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    Page<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end,
            Pageable pageable);

    @Query("{ 'timestamp': { $gte: ?0, $lte: ?1 } }")
    Page<AuditLog> findByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId,
            Pageable pageable);

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    // Keep non-paginated for export or internal use
    List<AuditLog> findAllByOrderByTimestampDesc();
}