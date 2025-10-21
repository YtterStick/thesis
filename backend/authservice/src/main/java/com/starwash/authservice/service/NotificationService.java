package com.starwash.authservice.service;

import com.starwash.authservice.model.Notification;
import com.starwash.authservice.model.StockItem;
import com.starwash.authservice.repository.NotificationRepository;
import com.starwash.authservice.repository.StockRepository;
import com.starwash.authservice.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;

    // Manila timezone (GMT+8)
    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");
    
    // Track last notified status to avoid duplicate notifications
    private final ConcurrentHashMap<String, String> lastStockStatus = new ConcurrentHashMap<>();

    public NotificationService(NotificationRepository notificationRepository, 
                             UserRepository userRepository, 
                             StockRepository stockRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
    }

    // Get current time in Manila timezone
    private LocalDateTime getCurrentManilaTime() {
        return LocalDateTime.now(MANILA_ZONE);
    }

    // Enhanced notification method for different types
    public Notification createNotification(String userId, String type, String title, String message, String relatedEntityId) {
        Notification notification = new Notification(userId, type, title, message, relatedEntityId);
        // Override createdAt with Manila time
        notification.setCreatedAt(getCurrentManilaTime());
        return notificationRepository.save(notification);
    }

    // Notify both admin and staff for all notifications including inventory
    public void notifyAllUsers(String type, String title, String message, String relatedEntityId) {
        userRepository.findAll().forEach(user -> {
            if ("ADMIN".equals(user.getRole()) || "STAFF".equals(user.getRole())) {
                createNotification(user.getId(), type, title, message, relatedEntityId);
            }
        });
    }

    public void notifyAllStaff(String type, String title, String message, String relatedEntityId) {
        userRepository.findByRole("STAFF").forEach(staff -> {
            createNotification(staff.getId(), type, title, message, relatedEntityId);
        });
    }

    public void notifyAllAdmins(String type, String title, String message, String relatedEntityId) {
        userRepository.findByRole("ADMIN").forEach(admin -> {
            createNotification(admin.getId(), type, title, message, relatedEntityId);
        });
    }

    // Scheduled task to check stock levels every 30 minutes
    @Scheduled(fixedRate = 1800000) // 30 minutes in milliseconds
    public void autoCheckStockLevels() {
        try {
            System.out.println("🔄 Auto-checking stock levels at: " + getCurrentManilaTime());
            
            List<StockItem> allItems = stockRepository.findAll();
            
            for (StockItem item : allItems) {
                checkAndNotifyStockStatus(item);
            }
            
            System.out.println("✅ Auto stock check completed. Items checked: " + allItems.size());
        } catch (Exception e) {
            System.err.println("❌ Error in auto stock check: " + e.getMessage());
        }
    }

    // Check and notify stock status (called by both manual and auto checks)
    private void checkAndNotifyStockStatus(StockItem item) {
        if (item.getLowStockThreshold() == null || item.getAdequateStockThreshold() == null) {
            return;
        }

        int currentQuantity = item.getQuantity();
        int lowThreshold = item.getLowStockThreshold();
        int adequateThreshold = item.getAdequateStockThreshold();

        String currentStatus = determineStockStatus(currentQuantity, lowThreshold, adequateThreshold);
        String itemKey = item.getId();
        String lastStatus = lastStockStatus.get(itemKey);

        // Only notify if status changed or if it's a critical status (out of stock or low stock)
        if (!currentStatus.equals(lastStatus) || 
            "OUT_OF_STOCK".equals(currentStatus) || 
            "LOW_STOCK".equals(currentStatus)) {
            
            sendStockStatusNotification(item, currentQuantity, currentStatus);
            lastStockStatus.put(itemKey, currentStatus);
        }
    }

    private String determineStockStatus(int quantity, int lowThreshold, int adequateThreshold) {
        if (quantity == 0) {
            return "OUT_OF_STOCK";
        } else if (quantity <= lowThreshold) {
            return "LOW_STOCK";
        } else if (quantity <= adequateThreshold) {
            return "ADEQUATE_STOCK";
        } else {
            return "FULLY_STOCKED";
        }
    }

    private void sendStockStatusNotification(StockItem item, int currentQuantity, String status) {
        String message;
        String title;
        String type;

        switch (status) {
            case "OUT_OF_STOCK":
                title = "🚨 Out of Stock Alert";
                message = String.format("%s is completely out of stock. Please restock immediately!", item.getName());
                type = "stock_alert";
                break;
            case "LOW_STOCK":
                title = "⚠️ Low Stock Warning";
                message = String.format("%s is running low. Current quantity: %d %s. Low threshold: %d %s", 
                    item.getName(), currentQuantity, item.getUnit(), item.getLowStockThreshold(), item.getUnit());
                type = "stock_alert";
                break;
            case "ADEQUATE_STOCK":
                title = "ℹ️ Adequate Stock Level";
                message = String.format("%s is at adequate level. Current quantity: %d %s.", 
                    item.getName(), currentQuantity, item.getUnit());
                type = "stock_info";
                break;
            case "FULLY_STOCKED":
                title = "✅ Fully Stocked";
                message = String.format("%s is fully stocked. Current quantity: %d %s.", 
                    item.getName(), currentQuantity, item.getUnit());
                type = "stock_info";
                break;
            default:
                return;
        }

        notifyAllUsers(type, title, message, item.getId());
        System.out.println("📢 Auto stock notification sent: " + title + " - " + message);
    }

    // Enhanced stock level notification logic for manual operations
    public void checkAndNotifyStockLevel(StockItem item, Integer previousQuantity) {
        if (item.getLowStockThreshold() == null || item.getAdequateStockThreshold() == null) {
            return;
        }

        int currentQuantity = item.getQuantity();
        int lowThreshold = item.getLowStockThreshold();
        int adequateThreshold = item.getAdequateStockThreshold();

        // Always check current status regardless of previous quantity
        checkCurrentStockStatus(item, currentQuantity, lowThreshold, adequateThreshold);
        
        // Also check transitions if we have previous quantity
        if (previousQuantity != null) {
            handleStockLevelTransitions(item, previousQuantity, currentQuantity, lowThreshold, adequateThreshold);
        }

        // Update the last known status
        String currentStatus = determineStockStatus(currentQuantity, lowThreshold, adequateThreshold);
        lastStockStatus.put(item.getId(), currentStatus);
    }

    private void checkCurrentStockStatus(StockItem item, int currentQuantity, int lowThreshold, int adequateThreshold) {
        String message;
        String title;
        String type;
        
        if (currentQuantity == 0) {
            title = "🚨 Out of Stock Alert";
            message = String.format("%s is out of stock. Please restock immediately.", item.getName());
            type = "stock_alert";
        } else if (currentQuantity <= lowThreshold) {
            title = "⚠️ Low Stock Alert";
            message = String.format("%s is running low. Current quantity: %d %s. Threshold: %d %s", 
                item.getName(), currentQuantity, item.getUnit(), lowThreshold, item.getUnit());
            type = "stock_alert";
        } else if (currentQuantity <= adequateThreshold) {
            title = "ℹ️ Adequate Stock";
            message = String.format("%s is at adequate level. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            type = "stock_info";
        } else {
            title = "✅ Fully Stocked";
            message = String.format("%s is fully stocked. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            type = "stock_info";
        }
        
        // Only notify if this is a meaningful state change
        notifyAllUsers(type, title, message, item.getId());
    }

    private void handleStockLevelTransitions(StockItem item, int previousQuantity, int currentQuantity, 
                                           int lowThreshold, int adequateThreshold) {
        // Out of stock notification
        if (previousQuantity > 0 && currentQuantity == 0) {
            String message = String.format("%s is now out of stock. Please restock immediately.", item.getName());
            notifyAllUsers("stock_alert", "🚨 Out of Stock Alert", message, item.getId());
        }
        // Low stock notification (crossed from above to below low threshold)
        else if (previousQuantity > lowThreshold && currentQuantity <= lowThreshold && currentQuantity > 0) {
            String message = String.format("%s is running low. Current quantity: %d %s. Threshold: %d %s", 
                item.getName(), currentQuantity, item.getUnit(), lowThreshold, item.getUnit());
            notifyAllUsers("stock_alert", "⚠️ Low Stock Alert", message, item.getId());
        }
        // Adequate stock notification (crossed from low to adequate or from stocked to adequate)
        else if ((previousQuantity <= lowThreshold || previousQuantity > adequateThreshold) && 
                 currentQuantity > lowThreshold && currentQuantity <= adequateThreshold) {
            String message = String.format("%s is at adequate level. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            notifyAllUsers("stock_info", "ℹ️ Adequate Stock", message, item.getId());
        }
        // Fully stocked notification (crossed from adequate to stocked)
        else if (previousQuantity <= adequateThreshold && currentQuantity > adequateThreshold) {
            String message = String.format("%s is fully stocked. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            notifyAllUsers("stock_info", "✅ Fully Stocked", message, item.getId());
        }
        // Restock notification (significant quantity increase)
        else if (currentQuantity > previousQuantity && (currentQuantity - previousQuantity) >= 10) {
            String message = String.format("%s was restocked. Added %d %s. New quantity: %d %s", 
                item.getName(), (currentQuantity - previousQuantity), item.getUnit(), currentQuantity, item.getUnit());
            notifyAllUsers("inventory_update", "📦 Restock Completed", message, item.getId());
        }
    }

    // Simple stock status check without transitions
    public void notifyCurrentStockStatus(StockItem item) {
        int currentQuantity = item.getQuantity();
        int lowThreshold = item.getLowStockThreshold();
        int adequateThreshold = item.getAdequateStockThreshold();

        if (currentQuantity == 0) {
            String message = String.format("%s is out of stock. Please restock immediately.", item.getName());
            notifyAllUsers("stock_alert", "🚨 Out of Stock Alert", message, item.getId());
        } else if (currentQuantity <= lowThreshold) {
            String message = String.format("%s is running low. Current quantity: %d %s. Threshold: %d %s", 
                item.getName(), currentQuantity, item.getUnit(), lowThreshold, item.getUnit());
            notifyAllUsers("stock_alert", "⚠️ Low Stock Alert", message, item.getId());
        } else if (currentQuantity <= adequateThreshold) {
            String message = String.format("%s is at adequate level. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            notifyAllUsers("stock_info", "ℹ️ Adequate Stock", message, item.getId());
        } else {
            String message = String.format("%s is fully stocked. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            notifyAllUsers("stock_info", "✅ Fully Stocked", message, item.getId());
        }
    }

    // Manual trigger for stock check (can be called from API)
    public void triggerStockCheck() {
        System.out.println("🔍 Manual stock check triggered at: " + getCurrentManilaTime());
        autoCheckStockLevels();
    }

    // Add these specific laundry status notification methods
    public void notifyLoadWashed(String customerName, String transactionId, int loadNumber) {
        String title = "🧼 Load Washed - Ready for Drying";
        String message = String.format("Load %d for %s has been washed and is ready for drying.", 
            loadNumber, customerName);
        
        notifyAllUsers(Notification.TYPE_LOAD_WASHED, title, message, transactionId);
        System.out.println("📢 Load washed notification sent: " + message);
    }

    public void notifyLoadDried(String customerName, String transactionId, int loadNumber) {
        String title = "🔥 Load Dried - Ready for Folding";
        String message = String.format("Load %d for %s has been dried and is ready for folding.", 
            loadNumber, customerName);
        
        notifyAllUsers(Notification.TYPE_LOAD_DRIED, title, message, transactionId);
        System.out.println("📢 Load dried notification sent: " + message);
    }

    public void notifyLoadCompleted(String customerName, String transactionId, int loadNumber) {
        String title = "✅ Load Completed";
        String message = String.format("Load %d for %s has been completed.", 
            loadNumber, customerName);
        
        notifyAllUsers(Notification.TYPE_LOAD_COMPLETED, title, message, transactionId);
        System.out.println("📢 Load completed notification sent: " + message);
    }

    // New method to notify about transaction stock issues
    public void notifyTransactionStockIssue(String itemName, int requestedQuantity, int availableQuantity, String transactionId) {
        String title = "🚨 Transaction Stock Issue";
        String message = String.format("Cannot complete transaction for %s. Requested: %d, Available: %d", 
            itemName, requestedQuantity, availableQuantity);
        
        notifyAllUsers("stock_alert", title, message, transactionId);
        System.out.println("📢 Transaction stock issue notification sent: " + message);
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(String id) {
        return notificationRepository.findById(id).map(notification -> {
            notification.setRead(true);
            return notificationRepository.save(notification);
        }).orElse(null);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false);
        unread.forEach(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndRead(userId, false);
    }
}