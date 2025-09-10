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

    List<LaundryJob> findByCustomerName(String customerName);

    Optional<LaundryJob> findByLoadAssignmentsMachineId(String machineId);
    
    List<LaundryJob> findByPickupStatus(String pickupStatus);
    
    List<LaundryJob> findByPickupStatusAndLoadAssignmentsStatus(String pickupStatus, String loadStatus);
    
    @Query("{ 'pickupStatus': 'UNCLAIMED', 'expiryDate': { $lt: ?0 }, 'disposed': false }")
    List<LaundryJob> findExpiredUnclaimedJobs(LocalDateTime currentDate);
    
    @Query("{ 'pickupStatus': 'UNCLAIMED', 'disposed': false }")
    List<LaundryJob> findActiveUnclaimedJobs();
    
    List<LaundryJob> findByDisposed(boolean disposed);
    
    List<LaundryJob> findByDisposedByStaffId(String staffId);
    
    @Query("{ 'pickupStatus': 'UNCLAIMED', 'expiryDate': null, 'loadAssignments.endTime': { $exists: true, $ne: null } }")
    List<LaundryJob> findJobsNeedingExpiryCalculation();
}