package com.starwash.authservice.repository;

import com.starwash.authservice.model.MissingItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MissingItemRepository extends MongoRepository<MissingItem, String> {
    List<MissingItem> findByIsClaimed(boolean isClaimed);
    List<MissingItem> findByMachineId(String machineId);
    List<MissingItem> findByFoundByStaffId(String staffId);
}