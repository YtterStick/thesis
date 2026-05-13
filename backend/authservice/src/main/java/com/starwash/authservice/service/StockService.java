package com.starwash.authservice.service;

import com.starwash.authservice.model.StockItem;
import com.starwash.authservice.model.StockLog;
import com.starwash.authservice.repository.StockRepository;
import com.starwash.authservice.repository.StockLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class StockService {

    private final StockRepository stockRepository;
    private final StockLogRepository stockLogRepository;
    private final NotificationService notificationService;

    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");

    public StockService(StockRepository stockRepository, StockLogRepository stockLogRepository, NotificationService notificationService) {
        this.stockRepository = stockRepository;
        this.stockLogRepository = stockLogRepository;
        this.notificationService = notificationService;
    }

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

        // Log initial stock
        StockLog log = new StockLog(
            savedItem.getId(),
            savedItem.getName(),
            "INITIAL",
            savedItem.getQuantity(),
            0,
            savedItem.getQuantity(),
            savedItem.getUpdatedBy(),
            "Initial inventory entry"
        );
        log.setTimestamp(manilaTime);
        stockLogRepository.save(log);

        notificationService.notifyCurrentStockStatus(savedItem);
        return savedItem;
    }

    public Optional<StockItem> updateItem(String id, StockItem updatedItem) {
        validateThresholds(updatedItem);

        return stockRepository.findById(id).map(existing -> {
            Integer previousQuantity = existing.getQuantity();
            int newQuantity = updatedItem.getQuantity();

            existing.setName(updatedItem.getName());
            existing.setQuantity(newQuantity);
            existing.setUnit(updatedItem.getUnit());
            existing.setPrice(updatedItem.getPrice());
            existing.setUpdatedBy(updatedItem.getUpdatedBy());
            existing.setLowStockThreshold(updatedItem.getLowStockThreshold());
            existing.setAdequateStockThreshold(updatedItem.getAdequateStockThreshold());
            LocalDateTime manilaTime = getCurrentManilaTime();
            existing.setLastUpdated(manilaTime);

            StockItem savedItem = stockRepository.save(existing);

            // Log update if quantity changed
            if (previousQuantity != newQuantity) {
                StockLog log = new StockLog(
                    savedItem.getId(),
                    savedItem.getName(),
                    "UPDATE",
                    newQuantity - previousQuantity,
                    previousQuantity,
                    newQuantity,
                    savedItem.getUpdatedBy(),
                    "Manual quantity adjustment"
                );
                log.setTimestamp(manilaTime);
                stockLogRepository.save(log);
            }

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

            // Log restock
            StockLog log = new StockLog(
                savedItem.getId(),
                savedItem.getName(),
                "ADD",
                amount,
                previousQuantity,
                savedItem.getQuantity(),
                updatedBy,
                "Regular restock"
            );
            log.setTimestamp(manilaTime);
            stockLogRepository.save(log);

            // Send ONLY ONE restock notification
            if (amount > 0) {
                String message = String.format("%s was restocked. Added %d %s. New quantity: %d %s", 
                    item.getName(), amount, item.getUnit(), savedItem.getQuantity(), item.getUnit());
                notificationService.notifyAllUsers(
                    NotificationService.INVENTORY_UPDATE, 
                    "📦 Restock Completed", 
                    message, 
                    item.getId()
                );
                System.out.println("📢 Restock notification sent: " + message);
            }

            return savedItem;
        });
    }

    public Optional<StockItem> deductStock(String id, int amount, String updatedBy, String notes) {
        return stockRepository.findById(id).map(item -> {
            Integer previousQuantity = item.getQuantity();
            int newQuantity = Math.max(0, item.getQuantity() - amount);
            int actualDeduction = previousQuantity - newQuantity;

            item.setQuantity(newQuantity);
            LocalDateTime manilaTime = getCurrentManilaTime();
            item.setLastUpdated(manilaTime);
            item.setUpdatedBy(updatedBy);

            StockItem savedItem = stockRepository.save(item);

            // Log deduction
            StockLog log = new StockLog(
                savedItem.getId(),
                savedItem.getName(),
                "DEDUCT",
                -actualDeduction,
                previousQuantity,
                newQuantity,
                updatedBy,
                notes != null ? notes : "Manual deduction"
            );
            log.setTimestamp(manilaTime);
            stockLogRepository.save(log);

            notificationService.checkAndNotifyStockLevel(savedItem, previousQuantity);
            return savedItem;
        });
    }

    public List<com.starwash.authservice.model.StockLog> getItemHistory(String itemId) {
        return stockLogRepository.findByItemIdOrderByTimestampDesc(itemId);
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