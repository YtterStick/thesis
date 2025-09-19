package com.starwash.authservice.repository;

import com.starwash.authservice.model.LaundryJob;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LaundryJobRepository extends MongoRepository<LaundryJob, String> {

    // ✅ Find all jobs under a transaction (one transaction may create multiple
    // jobs/loads)
    List<LaundryJob> findByTransactionId(String transactionId);

    // ✅ Find a single job by transactionId
    Optional<LaundryJob> findFirstByTransactionId(String transactionId);

    // ✅ Find jobs for a specific customer
    List<LaundryJob> findByCustomerName(String customerName);

    // ✅ (Optional) Check if a machine is currently assigned to any load
    Optional<LaundryJob> findByLoadAssignmentsMachineId(String machineId);

    // ✅ Add method to find by pickup status
    List<LaundryJob> findByPickupStatus(String pickupStatus);

    // ✅ Add method to find completed and unclaimed jobs
    List<LaundryJob> findByPickupStatusAndLoadAssignmentsStatus(String pickupStatus, String loadStatus);

    // In LaundryJobRepository.java
    List<LaundryJob> findByExpiredTrueAndDisposedFalse();

    // Add this method
    List<LaundryJob> findByDisposedFalse();

    List<LaundryJob> findByDisposedTrue();
    
}
