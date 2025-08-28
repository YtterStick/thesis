package com.starwash.authservice.repository;

import com.starwash.authservice.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    List<Transaction> findByCustomerNameIgnoreCase(String customerName);

    List<Transaction> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    List<Transaction> findByPaymentMethod(String paymentMethod);

    List<Transaction> findByServiceNameIgnoreCase(String serviceName);
}