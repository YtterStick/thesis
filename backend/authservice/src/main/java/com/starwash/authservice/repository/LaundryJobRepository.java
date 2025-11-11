package com.starwash.authservice.repository;

import com.starwash.authservice.model.LaundryJob;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LaundryJobRepository extends MongoRepository<LaundryJob, String> {
    List<LaundryJob> findByTransactionId(String transactionId);

    Optional<LaundryJob> findFirstByTransactionId(String transactionId);

    // Exact case-sensitive search
    List<LaundryJob> findByCustomerName(String customerName);

    Optional<LaundryJob> findByLoadAssignmentsMachineId(String machineId);

    List<LaundryJob> findByPickupStatus(String pickupStatus);

    List<LaundryJob> findByPickupStatusAndLoadAssignmentsStatus(String pickupStatus, String loadStatus);

    List<LaundryJob> findByExpiredTrueAndDisposedFalse();

    List<LaundryJob> findByDisposedFalse();

    List<LaundryJob> findByDisposedTrue();

    List<LaundryJob> findByExpiredTrueOrDueDateBefore(java.time.LocalDateTime date);

    List<LaundryJob> findByPickupStatusAndExpiredAndDisposed(String pickupStatus, Boolean expired, Boolean disposed);

    // In LaundryJobRepository.java
    @Query("{ 'loadAssignments.status': { $ne: 'COMPLETED' } }")
    List<LaundryJob> findIncompleteJobs();
    
    
    @Query("{ 'transactionId': { $in: ?0 } }")
    List<LaundryJob> findByTransactionIdIn(List<String> transactionIds);
}