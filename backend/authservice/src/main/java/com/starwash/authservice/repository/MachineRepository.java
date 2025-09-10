package com.starwash.authservice.repository;

import com.starwash.authservice.model.MachineItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MachineRepository extends MongoRepository<MachineItem, String> {
    List<MachineItem> findByStatus(String status);
    List<MachineItem> findByType(String type);
    List<MachineItem> findByStatusAndType(String status, String type);
}