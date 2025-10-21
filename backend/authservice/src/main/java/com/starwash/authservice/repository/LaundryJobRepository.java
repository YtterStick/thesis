package com.starwash.authservice.repository;

import com.starwash.authservice.model.LaundryJob;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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

    // Find jobs that have at least one load NOT completed (exclude jobs where ALL loads are COMPLETED)
    @Query("{ 'loadAssignments.status': { $ne: 'COMPLETED' } }")
    List<LaundryJob> findActiveJobs();

    // Count all completed loads (for summary) - only fetch loadAssignments to optimize
    @Query(value = "{}", fields = "{ 'loadAssignments' : 1 }")
    List<LaundryJob> findAllForCompletionStats();

    // Find jobs with completed loads for a specific date range
    @Query(value = "{ 'loadAssignments.status': 'COMPLETED', 'loadAssignments.endTime': { $gte: ?0, $lt: ?1 } }", fields = "{ 'loadAssignments' : 1 }")
    List<LaundryJob> findJobsWithCompletedLoadsByDateRange(LocalDateTime start, LocalDateTime end);
}