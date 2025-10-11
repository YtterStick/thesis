package com.starwash.authservice.repository;

import com.starwash.authservice.model.ServiceItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ServiceRepository extends MongoRepository<ServiceItem, String> {
  Optional<ServiceItem> findByNameIgnoreCase(String name);
}