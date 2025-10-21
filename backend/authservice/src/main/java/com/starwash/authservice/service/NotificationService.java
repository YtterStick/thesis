package com.starwash.authservice.service;

import com.starwash.authservice.model.Notification;
import com.starwash.authservice.model.StockItem;
import com.starwash.authservice.repository.NotificationRepository;
import com.starwash.authservice.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // Manila timezone (GMT+8)
    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
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

    // Add these specific laundry status notification methods
    public void notifyLoadWashed(String customerName, String transactionId, int loadNumber) {
        String title = "Load Washed - Ready for Drying";
        String message = String.format("Load %d for %s has been washed and is ready for drying.", 
            loadNumber, customerName);
        
        notifyAllUsers(Notification.TYPE_LOAD_WASHED, title, message, transactionId);
        System.out.println("📢 Load washed notification sent: " + message);
    }

    public void notifyLoadDried(String customerName, String transactionId, int loadNumber) {
        String title = "Load Dried - Ready for Folding";
        String message = String.format("Load %d for %s has been dried and is ready for folding.", 
            loadNumber, customerName);
        
        notifyAllUsers(Notification.TYPE_LOAD_DRIED, title, message, transactionId);
        System.out.println("📢 Load dried notification sent: " + message);
    }

    public void notifyLoadCompleted(String customerName, String transactionId, int loadNumber) {
        String title = "Load Completed";
        String message = String.format("Load %d for %s has been completed.", 
            loadNumber, customerName);
        
        notifyAllUsers(Notification.TYPE_LOAD_COMPLETED, title, message, transactionId);
        System.out.println("📢 Load completed notification sent: " + message);
    }

    // Enhanced stock level notification logic - UPDATED VERSION
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
    }

    private void checkCurrentStockStatus(StockItem item, int currentQuantity, int lowThreshold, int adequateThreshold) {
        String message;
        String title;
        String type;
        
        if (currentQuantity == 0) {
            title = "Out of Stock Alert";
            message = String.format("%s is out of stock. Please restock immediately.", item.getName());
            type = "stock_alert";
        } else if (currentQuantity <= lowThreshold) {
            title = "Low Stock Alert";
            message = String.format("%s is running low. Current quantity: %d %s. Threshold: %d %s", 
                item.getName(), currentQuantity, item.getUnit(), lowThreshold, item.getUnit());
            type = "stock_alert";
        } else if (currentQuantity <= adequateThreshold) {
            title = "Adequate Stock";
            message = String.format("%s is at adequate level. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            type = "stock_info";
        } else {
            title = "Fully Stocked";
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
            notifyAllUsers("stock_alert", "Out of Stock Alert", message, item.getId());
        }
        // Low stock notification (crossed from above to below low threshold)
        else if (previousQuantity > lowThreshold && currentQuantity <= lowThreshold && currentQuantity > 0) {
            String message = String.format("%s is running low. Current quantity: %d %s. Threshold: %d %s", 
                item.getName(), currentQuantity, item.getUnit(), lowThreshold, item.getUnit());
            notifyAllUsers("stock_alert", "Low Stock Alert", message, item.getId());
        }
        // Adequate stock notification (crossed from low to adequate or from stocked to adequate)
        else if ((previousQuantity <= lowThreshold || previousQuantity > adequateThreshold) && 
                 currentQuantity > lowThreshold && currentQuantity <= adequateThreshold) {
            String message = String.format("%s is at adequate level. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            notifyAllUsers("stock_info", "Adequate Stock", message, item.getId());
        }
        // Fully stocked notification (crossed from adequate to stocked)
        else if (previousQuantity <= adequateThreshold && currentQuantity > adequateThreshold) {
            String message = String.format("%s is fully stocked. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            notifyAllUsers("stock_info", "Fully Stocked", message, item.getId());
        }
        // Restock notification (significant quantity increase)
        else if (currentQuantity > previousQuantity && (currentQuantity - previousQuantity) >= 10) {
            String message = String.format("%s was restocked. Added %d %s. New quantity: %d %s", 
                item.getName(), (currentQuantity - previousQuantity), item.getUnit(), currentQuantity, item.getUnit());
            notifyAllUsers("inventory_update", "Restock Completed", message, item.getId());
        }
    }

    // Simple stock status check without transitions
    public void notifyCurrentStockStatus(StockItem item) {
        int currentQuantity = item.getQuantity();
        int lowThreshold = item.getLowStockThreshold();
        int adequateThreshold = item.getAdequateStockThreshold();

        if (currentQuantity == 0) {
            String message = String.format("%s is out of stock. Please restock immediately.", item.getName());
            notifyAllUsers("stock_alert", "Out of Stock Alert", message, item.getId());
        } else if (currentQuantity <= lowThreshold) {
            String message = String.format("%s is running low. Current quantity: %d %s. Threshold: %d %s", 
                item.getName(), currentQuantity, item.getUnit(), lowThreshold, item.getUnit());
            notifyAllUsers("stock_alert", "Low Stock Alert", message, item.getId());
        } else if (currentQuantity <= adequateThreshold) {
            String message = String.format("%s is at adequate level. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            notifyAllUsers("stock_info", "Adequate Stock", message, item.getId());
        } else {
            String message = String.format("%s is fully stocked. Current quantity: %d %s.", 
                item.getName(), currentQuantity, item.getUnit());
            notifyAllUsers("stock_info", "Fully Stocked", message, item.getId());
        }
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
}//