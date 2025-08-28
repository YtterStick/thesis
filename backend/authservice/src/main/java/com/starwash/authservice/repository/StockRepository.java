package com.starwash.authservice.repository;

import com.starwash.authservice.model.StockItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends MongoRepository<StockItem, String> {

    // Find by exact name
    Optional<StockItem> findByName(String name);

    // Find items with low quantity, useful for alerts or restock prompts
    List<StockItem> findByQuantityLessThan(int threshold);

    // Filter items updated by a specific user (if tracking ownership/audits)
    List<StockItem> findByUpdatedBy(String updatedBy);

    // ✅ New: Find items below admin-defined low stock threshold
    List<StockItem> findByQuantityLessThanEqual(Integer lowStockThreshold);

    // ✅ New: Find items between low and adequate thresholds
    List<StockItem> findByQuantityGreaterThanAndQuantityLessThanEqual(Integer lowStockThreshold, Integer adequateStockThreshold);

    // ✅ New: Find items above adequate threshold (fully stocked)
    List<StockItem> findByQuantityGreaterThan(Integer adequateStockThreshold);

    // ✅ Optional: Find items that have been restocked (previous quantity tracked)
    List<StockItem> findByPreviousQuantityNotNull();
}