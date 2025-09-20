package com.starwash.authservice.repository;

import com.starwash.authservice.model.StockItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends MongoRepository<StockItem, String> {

    Optional<StockItem> findByName(String name);

    List<StockItem> findByQuantityLessThan(int threshold);

    List<StockItem> findByUpdatedBy(String updatedBy);

    List<StockItem> findByQuantityLessThanEqual(Integer lowStockThreshold);

    List<StockItem> findByQuantityGreaterThanAndQuantityLessThanEqual(Integer lowStockThreshold, Integer adequateStockThreshold);

    List<StockItem> findByQuantityGreaterThan(Integer adequateStockThreshold);

    List<StockItem> findByPreviousQuantityNotNull();
}