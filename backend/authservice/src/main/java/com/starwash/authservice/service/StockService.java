package com.starwash.authservice.service;

import com.starwash.authservice.model.StockItem;
import com.starwash.authservice.repository.StockRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class StockService {

    private final StockRepository stockRepository;
    private final NotificationService notificationService;

    // Manila timezone (GMT+8)
    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");

    public StockService(StockRepository stockRepository, NotificationService notificationService) {
        this.stockRepository = stockRepository;
        this.notificationService = notificationService;
    }

    // Get current time in Manila timezone
    private LocalDateTime getCurrentManilaTime() {
        return LocalDateTime.now(MANILA_ZONE);
    }

    public List<StockItem> getAllItems() {
        return stockRepository.findAll();
    }

    public Optional<StockItem> getItemById(String id) {
        return stockRepository.findById(id);
    }

    public StockItem createItem(StockItem newItem) {
        validateThresholds(newItem);
        LocalDateTime manilaTime = getCurrentManilaTime();
        newItem.setCreatedAt(manilaTime);
        newItem.setLastUpdated(manilaTime);
        newItem.setLastRestock(newItem.getLastRestock() != null ? newItem.getLastRestock() : manilaTime);

        StockItem savedItem = stockRepository.save(newItem);

        // Notify about initial stock status
        notificationService.notifyCurrentStockStatus(savedItem);
        return savedItem;
    }

    public Optional<StockItem> updateItem(String id, StockItem updatedItem) {
        validateThresholds(updatedItem);

        return stockRepository.findById(id).map(existing -> {
            Integer previousQuantity = existing.getQuantity();

            // Update fields
            existing.setName(updatedItem.getName());
            existing.setQuantity(updatedItem.getQuantity());
            existing.setUnit(updatedItem.getUnit());
            existing.setPrice(updatedItem.getPrice());
            existing.setUpdatedBy(updatedItem.getUpdatedBy());
            existing.setLowStockThreshold(updatedItem.getLowStockThreshold());
            existing.setAdequateStockThreshold(updatedItem.getAdequateStockThreshold());
            existing.setLastUpdated(getCurrentManilaTime());

            StockItem savedItem = stockRepository.save(existing);

            // Check and notify about stock level changes
            notificationService.checkAndNotifyStockLevel(savedItem, previousQuantity);
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
            Integer previousQuantity = item.getQuantity();

            item.setQuantity(item.getQuantity() + amount);
            item.setLastRestockAmount(amount);
            LocalDateTime manilaTime = getCurrentManilaTime();
            item.setLastRestock(manilaTime);
            item.setLastUpdated(manilaTime);
            item.setUpdatedBy(updatedBy);

            StockItem savedItem = stockRepository.save(item);

            String message = String.format("%s was restocked. Added %d %s. New quantity: %d %s",
                    item.getName(), amount, item.getUnit(), item.getQuantity(), item.getUnit());

            // Notify about restock
            notificationService.notifyAllUsers("inventory_update",
                    "Restock Completed", message, item.getId());

            // Check stock level after restock
            notificationService.checkAndNotifyStockLevel(savedItem, previousQuantity);

            return savedItem;
        });
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