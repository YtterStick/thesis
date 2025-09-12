package com.starwash.authservice.repository;

import com.starwash.authservice.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    List<Transaction> findByCustomerNameIgnoreCase(String customerName);

    List<Transaction> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    List<Transaction> findByPaymentMethod(String paymentMethod);

    List<Transaction> findByServiceNameIgnoreCase(String serviceName);

    Optional<Transaction> findByInvoiceNumber(String invoiceNumber);
    // Add this method to fetch multiple transactions at once
    @Query("{ 'invoiceNumber': { $in: ?0 } }")
    List<Transaction> findByInvoiceNumberIn(List<String> invoiceNumbers);
}