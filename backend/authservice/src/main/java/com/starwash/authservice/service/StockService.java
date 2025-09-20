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
    private final NotificationService notificationService;

    public StockService(StockRepository stockRepository, NotificationService notificationService) {
        this.stockRepository = stockRepository;
        this.notificationService = notificationService;
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
        
        StockItem savedItem = stockRepository.save(newItem);
        checkStockStatusAndNotify(savedItem);
        return savedItem;
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
            
            StockItem savedItem = stockRepository.save(existing);
            checkStockStatusAndNotify(savedItem);
            return savedItem;
        });
    }

    public boolean deleteItem(String id) {
        if (stockRepository.existsById(id)) {
            stockRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Optional<StockItem> addStock(String id, int amount, String updatedBy) {
        return stockRepository.findById(id).map(item -> {
            int previousQuantity = item.getQuantity();
            item.setPreviousQuantity(previousQuantity);
            item.setQuantity(item.getQuantity() + amount);
            item.setLastRestockAmount(amount);
            item.setLastRestock(LocalDateTime.now());
            item.setLastUpdated(LocalDateTime.now());
            item.setUpdatedBy(updatedBy);
            
            StockItem savedItem = stockRepository.save(item);
            
            String message = String.format("%s was restocked. Added %d %s. New quantity: %d %s", 
                item.getName(), amount, item.getUnit(), item.getQuantity(), item.getUnit());
            
            notificationService.notifyAllStaff("inventory_update", 
                "Inventory Updated", message, item.getId());
            
            checkStockStatusAndNotify(savedItem);
            
            return savedItem;
        });
    }

    private void checkStockStatusAndNotify(StockItem item) {
        if (item.getQuantity() == 0) {
            String message = String.format("%s is out of stock. Please restock immediately.", item.getName());
            notificationService.notifyAllAdmins("stock_alert", "Out of Stock Alert", message, item.getId());
        } else if (item.getQuantity() <= item.getLowStockThreshold()) {
            String message = String.format("%s is running low. Current quantity: %d %s. Threshold: %d %s", 
                item.getName(), item.getQuantity(), item.getUnit(), 
                item.getLowStockThreshold(), item.getUnit());
            notificationService.notifyAllAdmins("stock_alert", "Low Stock Alert", message, item.getId());
        }
    }

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