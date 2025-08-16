package com.starwash.authservice.repository;

import com.starwash.authservice.model.ReceiptItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReceiptRepository extends MongoRepository<ReceiptItem, String> {

    // 🔍 Find receipts created by a specific staff user
    List<ReceiptItem> findByCreatedBy(String createdBy);

    // 🔍 Optional: filter by customer name
    List<ReceiptItem> findByCustomerName(String customerName);

    // ✅ NEW: Find receipt by receipt code (for public tracking)
    Optional<ReceiptItem> findByReceiptCode(String receiptCode);
}