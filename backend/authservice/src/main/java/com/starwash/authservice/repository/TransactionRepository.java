package com.starwash.authservice.repository;

import com.starwash.authservice.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    // 🔍 Find all transactions by customer name (case-insensitive)
    List<Transaction> findByCustomerNameIgnoreCase(String customerName);

    // 📅 Find transactions created within a date range
    List<Transaction> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // 💰 Find all paid transactions
    List<Transaction> findByStatus(String status);

    // 🧺 Find all transactions with a specific service name
    List<Transaction> findByServiceNameIgnoreCase(String serviceName);
}