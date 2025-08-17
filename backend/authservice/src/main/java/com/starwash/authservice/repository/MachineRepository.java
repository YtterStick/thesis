package com.starwash.authservice.repository;

import com.starwash.authservice.model.MachineItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MachineRepository extends MongoRepository<MachineItem, String> {
  // Optional: add custom queries like findByType or findByStatus
}