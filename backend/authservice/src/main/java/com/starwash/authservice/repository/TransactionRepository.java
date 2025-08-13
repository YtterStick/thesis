package com.starwash.authservice.repository;

import com.starwash.authservice.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {
    // Optional: add custom queries like findByCustomerName, findByCreatedAtBetween, etc.
}