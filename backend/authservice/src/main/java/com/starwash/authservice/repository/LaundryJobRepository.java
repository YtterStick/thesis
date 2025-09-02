package com.starwash.authservice.repository;

import com.starwash.authservice.model.LaundryJob;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LaundryJobRepository extends MongoRepository<LaundryJob, String> {
  // Optional: add custom queries like findByTransactionId or findByCustomerName
}