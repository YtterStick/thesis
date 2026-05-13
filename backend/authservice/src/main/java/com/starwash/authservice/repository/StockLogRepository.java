package com.starwash.authservice.repository;

import com.starwash.authservice.model.StockLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface StockLogRepository extends MongoRepository<StockLog, String> {
    List<StockLog> findByItemIdOrderByTimestampDesc(String itemId);
    List<StockLog> findAllByOrderByTimestampDesc();
}
