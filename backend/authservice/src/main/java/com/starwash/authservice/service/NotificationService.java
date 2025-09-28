package com.starwash.authservice.service;

import com.starwash.authservice.model.Notification;
import com.starwash.authservice.model.StockItem;
import com.starwash.authservice.repository.NotificationRepository;
import com.starwash.authservice.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public Notification createNotification(String userId, String type, String title, String message, String relatedEntityId) {
        Notification notification = new Notification(userId, type, title, message, relatedEntityId);
        return notificationRepository.save(notification);
    }

    // Notify both admin and staff
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

    // Enhanced stock level notification logic
    public void checkAndNotifyStockLevel(StockItem item, Integer previousQuantity) {
        if (item.getLowStockThreshold() == null || item.getAdequateStockThreshold() == null) {
            return;
        }

        int currentQuantity = item.getQuantity();
        int lowThreshold = item.getLowStockThreshold();
        int adequateThreshold = item.getAdequateStockThreshold();

        // Notify for initial item creation
        if (previousQuantity == null) {
            handleInitialStockNotification(item, currentQuantity, lowThreshold, adequateThreshold);
            return;
        }

        // Check stock level transitions
        handleStockLevelTransitions(item, previousQuantity, currentQuantity, lowThreshold, adequateThreshold);
    }

    private void handleInitialStockNotification(StockItem item, int currentQuantity, int lowThreshold, int adequateThreshold) {
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
}