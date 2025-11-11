package com.starwash.authservice.repository;

import com.starwash.authservice.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Aggregation;
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

    @Query("{ 'invoiceNumber': { $in: ?0 } }")
    List<Transaction> findByInvoiceNumberIn(List<String> invoiceNumbers);

    List<Transaction> findByPaymentMethodAndGcashVerified(String paymentMethod, Boolean gcashVerified);
    
    // Add these methods to your TransactionRepository.java
    @Query(value = "{}", fields = "{ 'totalPrice' : 1 }")
    List<Transaction> findTotalPrices();
    
    @Aggregation("{ $group: { _id: null, total: { $sum: '$totalPrice' } } }")
    Double sumTotalPrice();
    
    @Aggregation("{ $group: { _id: null, total: { $sum: '$serviceQuantity' } } }")
    Integer sumServiceQuantity();
    
    @Query("{ 'createdAt': { $gte: ?0 } }")
    List<Transaction> findByCreatedAtAfter(LocalDateTime date);
    
    @Aggregation(pipeline = {
        "{ $match: { 'createdAt': { $gte: ?0 } } }",
        "{ $group: { _id: null, total: { $sum: '$totalPrice' } } }"
    })
    Double sumTotalPriceByCreatedAtAfter(LocalDateTime date);
    
    @Aggregation(pipeline = {
        "{ $match: { 'createdAt': { $gte: ?0 } } }",
        "{ $group: { _id: null, total: { $sum: '$serviceQuantity' } } }"
    })
    Integer sumServiceQuantityByCreatedAtAfter(LocalDateTime date);
}