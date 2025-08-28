package com.starwash.authservice.service;

import com.starwash.authservice.model.StockItem;
import com.starwash.authservice.repository.StockRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class StockService {

    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    public List<StockItem> getAllItems() {
        return stockRepository.findAll();
    }

    public Optional<StockItem> getItemById(String id) {
        return stockRepository.findById(id);
    }

    public StockItem createItem(StockItem newItem) {
        validateThresholds(newItem);

        newItem.setCreatedAt(LocalDateTime.now());
        newItem.setLastUpdated(LocalDateTime.now());
        newItem.setLastRestock(newItem.getLastRestock() != null ? newItem.getLastRestock() : LocalDateTime.now());

        return stockRepository.save(newItem);
    }

    public Optional<StockItem> updateItem(String id, StockItem updatedItem) {
        validateThresholds(updatedItem);

        return stockRepository.findById(id).map(existing -> {
            existing.setName(updatedItem.getName());
            existing.setQuantity(updatedItem.getQuantity());
            existing.setUnit(updatedItem.getUnit());
            existing.setUpdatedBy(updatedItem.getUpdatedBy());

            existing.setLowStockThreshold(updatedItem.getLowStockThreshold());
            existing.setAdequateStockThreshold(updatedItem.getAdequateStockThreshold());
            existing.setPreviousQuantity(updatedItem.getPreviousQuantity());

            if (updatedItem.getLastRestock() != null) {
                existing.setLastRestock(updatedItem.getLastRestock());
            }

            existing.setLastRestockAmount(updatedItem.getLastRestockAmount());
            existing.setLastUpdated(LocalDateTime.now());

            return stockRepository.save(existing);
        });
    }

    public boolean deleteItem(String id) {
        if (stockRepository.existsById(id)) {
            stockRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Optional<StockItem> addStock(String id, int amount) {
        return stockRepository.findById(id).map(item -> {
            item.setPreviousQuantity(item.getQuantity());
            item.setQuantity(item.getQuantity() + amount);
            item.setLastRestockAmount(amount);
            item.setLastRestock(LocalDateTime.now());
            item.setLastUpdated(LocalDateTime.now());

            String status = item.getStockStatus(); // Optional: use for logging or alerts

            return stockRepository.save(item);
        });
    }

    // ✅ Threshold validation logic
    private void validateThresholds(StockItem item) {
        Integer low = item.getLowStockThreshold();
        Integer adequate = item.getAdequateStockThreshold();

        if (low == null || low <= 0) {
            throw new IllegalArgumentException("Low stock threshold must be greater than 0.");
        }

        if (adequate == null || adequate <= low) {
            throw new IllegalArgumentException("Adequate stock threshold must be greater than low stock threshold.");
        }
    }
}