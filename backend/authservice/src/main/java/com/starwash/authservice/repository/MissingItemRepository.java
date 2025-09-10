package com.starwash.authservice.repository;

import com.starwash.authservice.model.MissingItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MissingItemRepository extends MongoRepository<MissingItem, String> {
    
    List<MissingItem> findByIsClaimed(boolean isClaimed);
    
    List<MissingItem> findByFoundInMachineId(String machineId);
    
    List<MissingItem> findByFoundDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<MissingItem> findByFoundByStaffId(String staffId);
    
    @Query("{ 'foundDate': { $gte: ?0, $lte: ?1 }, 'foundInMachineId': ?2 }")
    List<MissingItem> findByDateRangeAndMachine(LocalDateTime startDate, LocalDateTime endDate, String machineId);
    
    List<MissingItem> findByItemDescriptionContainingIgnoreCase(String description);
}