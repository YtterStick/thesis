package com.starwash.authservice.repository;

import com.starwash.authservice.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.domain.Pageable;
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
    
    @Query(value = "{}", fields = "{ 'totalPrice' : 1 }")
    List<Transaction> findTotalPrices();
    
    // FIXED: MongoDB aggregation with proper filtering for positive prices
    @Aggregation(pipeline = {
        "{ $match: { 'totalPrice': { $gt: 0 } } }",
        "{ $group: { _id: null, total: { $sum: '$totalPrice' } } }"
    })
    Double sumTotalPrice();
    
    // FIXED: MongoDB aggregation with proper filtering for non-null quantities
    @Aggregation(pipeline = {
        "{ $match: { 'serviceQuantity': { $ne: null } } }",
        "{ $group: { _id: null, total: { $sum: '$serviceQuantity' } } }"
    })
    Integer sumServiceQuantity();
    
    @Query("{ 'createdAt': { $gte: ?0 } }")
    List<Transaction> findByCreatedAtAfter(LocalDateTime date);
    
    // NEW OPTIMIZED METHOD: Time-filtered records with pagination
    @Query("{ 'createdAt': { $gte: ?0 } }")
    List<Transaction> findByCreatedAtAfter(LocalDateTime date, Pageable pageable);
    
    @Aggregation(pipeline = {
        "{ $match: { 'createdAt': { $gte: ?0 }, 'totalPrice': { $gt: 0 } } }",
        "{ $group: { _id: null, total: { $sum: '$totalPrice' } } }"
    })
    Double sumTotalPriceByCreatedAtAfter(LocalDateTime date);
    
    @Aggregation(pipeline = {
        "{ $match: { 'createdAt': { $gte: ?0 }, 'serviceQuantity': { $ne: null } } }",
        "{ $group: { _id: null, total: { $sum: '$serviceQuantity' } } }"
    })
    Integer sumServiceQuantityByCreatedAtAfter(LocalDateTime date);

    // ✅ NEW: Find transactions by issueDate range
    List<Transaction> findByIssueDateBetween(LocalDateTime from, LocalDateTime to);

    // ✅ NEW: Find transactions by issueDate after a certain date
    List<Transaction> findByIssueDateAfter(LocalDateTime date);

    // ✅ NEW: Find transactions by issueDate after with pagination
    List<Transaction> findByIssueDateAfter(LocalDateTime date, Pageable pageable);

    // ✅ NEW: Aggregation for sum of totalPrice by issueDate
    @Aggregation(pipeline = {
        "{ $match: { 'issueDate': { $gte: ?0 }, 'totalPrice': { $gt: 0 } } }",
        "{ $group: { _id: null, total: { $sum: '$totalPrice' } } }"
    })
    Double sumTotalPriceByIssueDateAfter(LocalDateTime date);

    // ✅ NEW: Aggregation for sum of serviceQuantity by issueDate
    @Aggregation(pipeline = {
        "{ $match: { 'issueDate': { $gte: ?0 }, 'serviceQuantity': { $ne: null } } }",
        "{ $group: { _id: null, total: { $sum: '$serviceQuantity' } } }"
    })
    Integer sumServiceQuantityByIssueDateAfter(LocalDateTime date);

    // ✅ NEW: Count transactions by issueDate after
    @Query(value = "{ 'issueDate': { $gte: ?0 } }", count = true)
    long countByIssueDateAfter(LocalDateTime date);

    // ✅ NEW: Find transactions by issueDate range with pagination
    List<Transaction> findByIssueDateBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);
}