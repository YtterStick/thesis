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
}