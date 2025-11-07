package com.starwash.authservice.service;

import com.starwash.authservice.model.Notification;
import com.starwash.authservice.model.StockItem;
import com.starwash.authservice.model.User;
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

    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");
    
    private final ConcurrentHashMap<String, String> lastStockStatus = new ConcurrentHashMap<>();

    // Notification types
    public static final String TYPE_LOAD_WASHED = "load_washed";
    public static final String TYPE_LOAD_DRIED = "load_dried";
    public static final String TYPE_LOAD_COMPLETED = "load_completed";
    public static final String NEW_LAUNDRY_SERVICE = "new_laundry_service";
    public static final String STOCK_ALERT = "stock_alert";
    public static final String INVENTORY_UPDATE = "inventory_update";
    public static final String STOCK_INFO = "stock_info";
    public static final String EXPIRED_LAUNDRY = "expired_laundry";
    public static final String WARNING = "warning";
    public static final String LOW_STOCK_WARNING = "low_stock_warning";
    public static final String ADEQUATE_STOCK_LEVEL = "adequate_stock_level";

    public NotificationService(NotificationRepository notificationRepository, 
                             UserRepository userRepository, 
                             StockRepository stockRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
    }

    private LocalDateTime getCurrentManilaTime() {
        return LocalDateTime.now(MANILA_ZONE);
    }

    public Notification createNotification(String userId, String type, String title, String message, String relatedEntityId) {
        Notification notification = new Notification(userId, type, title, message, relatedEntityId);
        notification.setCreatedAt(getCurrentManilaTime());
        return notificationRepository.save(notification);
    }

    // Updated to filter notifications based on user role
    public void notifyAllUsers(String type, String title, String message, String relatedEntityId) {
        userRepository.findAll().forEach(user -> {
            if (shouldReceiveNotification(user, type)) {
                createNotification(user.getId(), type, title, message, relatedEntityId);
            }
        });
    }

    public void notifyAllStaff(String type, String title, String message, String relatedEntityId) {
        userRepository.findByRole("STAFF").forEach(staff -> {
            if (shouldReceiveNotification(staff, type)) {
                createNotification(staff.getId(), type, title, message, relatedEntityId);
            }
        });
    }

    public void notifyAllAdmins(String type, String title, String message, String relatedEntityId) {
        userRepository.findByRole("ADMIN").forEach(admin -> {
            if (shouldReceiveNotification(admin, type)) {
                createNotification(admin.getId(), type, title, message, relatedEntityId);
            }
        });
    }

    // Determine if user should receive this notification type
    private boolean shouldReceiveNotification(User user, String notificationType) {
        String userRole = user.getRole();
        
        // ADMIN only receives stock-related and important system notifications
        if ("ADMIN".equals(userRole)) {
            return isStockRelatedNotification(notificationType);
        }
        
        // STAFF receives all notifications
        if ("STAFF".equals(userRole)) {
            return true;
        }
        
        return false;
    }

    // Check if notification is stock-related (ADMIN should receive these)
    private boolean isStockRelatedNotification(String notificationType) {
        return notificationType.equals(STOCK_ALERT) ||
               notificationType.equals(INVENTORY_UPDATE) ||
               notificationType.equals(STOCK_INFO) ||
               notificationType.equals(EXPIRED_LAUNDRY) ||
               notificationType.equals(WARNING) ||
               notificationType.equals(LOW_STOCK_WARNING) ||
               notificationType.equals(ADEQUATE_STOCK_LEVEL);
    }

    // Stock monitoring methods
    @Scheduled(fixedRate = 1800000) // 30 minutes
    public void autoCheckStockLevels() {
        try {
            System.out.println("🔄 Auto-checking stock levels at: " + getCurrentManilaTime());
            
            List<StockItem> allItems = stockRepository.findAll();
            int statusChanges = 0;
            
            for (StockItem item : allItems) {
                if (checkAndNotifyStockStatus(item)) {
                    statusChanges++;
                }
            }
            
            System.out.println("✅ Auto stock check completed. Items checked: " + allItems.size() + ", Status changes: " + statusChanges);
        } catch (Exception e) {
            System.err.println("❌ Error in auto stock check: " + e.getMessage());
        }
    }

    private boolean checkAndNotifyStockStatus(StockItem item) {
        if (item.getLowStockThreshold() == null || item.getAdequateStockThreshold() == null) {
            return false;
        }

        int currentQuantity = item.getQuantity();
        int lowThreshold = item.getLowStockThreshold();
        int adequateThreshold = item.getAdequateStockThreshold();

        String currentStatus = determineStockStatus(currentQuantity, lowThreshold, adequateThreshold);
        String itemKey = item.getId();
        String lastStatus = lastStockStatus.get(itemKey);

        if (lastStatus == null || !currentStatus.equals(lastStatus)) {
            sendStockStatusNotification(item, currentQuantity, currentStatus, lastStatus);
            lastStockStatus.put(itemKey, currentStatus);
            return true;
        }
        
        return false;
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

    private void sendStockStatusNotification(StockItem item, int currentQuantity, String currentStatus, String previousStatus) {
        String message;
        String title;
        String type;

        boolean isImprovement = isStatusImprovement(previousStatus, currentStatus);
        
        switch (currentStatus) {
            case "OUT_OF_STOCK":
                title = "🚨 Out of Stock Alert";
                message = String.format("%s is completely out of stock. Please restock immediately!", item.getName());
                type = STOCK_ALERT;
                break;
            case "LOW_STOCK":
                if (isImprovement && "OUT_OF_STOCK".equals(previousStatus)) {
                    title = "🔄 Stock Restocked";
                    message = String.format("%s has been restocked from out of stock. Current quantity: %d %s", 
                        item.getName(), currentQuantity, item.getUnit());
                    type = INVENTORY_UPDATE;
                } else {
                    title = "⚠️ Low Stock Warning";
                    message = String.format("%s is running low. Current quantity: %d %s. Low threshold: %d %s", 
                        item.getName(), currentQuantity, item.getUnit(), item.getLowStockThreshold(), item.getUnit());
                    type = LOW_STOCK_WARNING;
                }
                break;
            case "ADEQUATE_STOCK":
                if (isImprovement) {
                    title = "📈 Stock Level Improved";
                    message = String.format("%s is now at adequate level. Current quantity: %d %s.", 
                        item.getName(), currentQuantity, item.getUnit());
                    type = STOCK_INFO;
                } else {
                    title = "ℹ️ Adequate Stock Level";
                    message = String.format("%s is at adequate level. Current quantity: %d %s.", 
                        item.getName(), currentQuantity, item.getUnit());
                    type = ADEQUATE_STOCK_LEVEL;
                }
                break;
            case "FULLY_STOCKED":
                title = "✅ Fully Stocked";
                message = String.format("%s is fully stocked. Current quantity: %d %s.", 
                    item.getName(), currentQuantity, item.getUnit());
                type = STOCK_INFO;
                break;
            default:
                return;
        }

        notifyAllUsers(type, title, message, item.getId());
        System.out.println("📢 Stock status change notification: " + title + " - " + message);
        System.out.println("   Previous status: " + previousStatus + " → Current status: " + currentStatus);
    }

    private boolean isStatusImprovement(String previousStatus, String currentStatus) {
        if (previousStatus == null) return false;
        
        String[] statusHierarchy = {"OUT_OF_STOCK", "LOW_STOCK", "ADEQUATE_STOCK", "FULLY_STOCKED"};
        
        int previousIndex = -1;
        int currentIndex = -1;
        
        for (int i = 0; i < statusHierarchy.length; i++) {
            if (statusHierarchy[i].equals(previousStatus)) {
                previousIndex = i;
            }
            if (statusHierarchy[i].equals(currentStatus)) {
                currentIndex = i;
            }
        }
        
        return currentIndex > previousIndex;
    }

    // Laundry notification methods - ONLY FOR STAFF
    public void notifyLoadWashed(String customerName, String transactionId, int loadNumber) {
        String title = "🧼 Load Washed - Ready for Drying";
        String message = String.format("Load %d for %s has been washed and is ready for drying.", 
            loadNumber, customerName);
        
        // Only notify STAFF for laundry updates
        notifyAllStaff(TYPE_LOAD_WASHED, title, message, transactionId);
        System.out.println("📢 Load washed notification sent to STAFF: " + message);
    }

    public void notifyLoadDried(String customerName, String transactionId, int loadNumber) {
        String title = "🔥 Load Dried - Ready for Folding";
        String message = String.format("Load %d for %s has been dried and is ready for folding.", 
            loadNumber, customerName);
        
        // Only notify STAFF for laundry updates
        notifyAllStaff(TYPE_LOAD_DRIED, title, message, transactionId);
        System.out.println("📢 Load dried notification sent to STAFF: " + message);
    }

    public void notifyLoadCompleted(String customerName, String transactionId, int loadNumber) {
        String title = "✅ Load Completed";
        String message = String.format("Load %d for %s has been completed.", 
            loadNumber, customerName);
        
        // Only notify STAFF for laundry updates
        notifyAllStaff(TYPE_LOAD_COMPLETED, title, message, transactionId);
        System.out.println("📢 Load completed notification sent to STAFF: " + message);
    }

    public void notifyNewLaundryService(String customerName, String transactionId, String serviceType) {
        String title = "🆕 New Laundry Service";
        String message = String.format("New %s service started for %s", serviceType, customerName);
        
        // Only notify STAFF for new laundry services
        notifyAllStaff(NEW_LAUNDRY_SERVICE, title, message, transactionId);
        System.out.println("📢 New laundry service notification sent to STAFF: " + message);
    }

    // Stock-related notification methods - FOR BOTH ADMIN AND STAFF
    public void notifyExpiredLaundry(String itemName, String location, LocalDateTime expiryDate) {
        String title = "🚨 Expired Laundry Alert";
        String message = String.format("%s at %s has expired on %s. Please take action immediately.", 
            itemName, location, expiryDate.toString());
        
        // Both ADMIN and STAFF receive expired laundry notifications
        notifyAllUsers(EXPIRED_LAUNDRY, title, message, null);
        System.out.println("📢 Expired laundry notification sent: " + message);
    }

    public void notifyGeneralWarning(String subject, String details) {
        String title = "⚠️ System Warning";
        String message = String.format("%s: %s", subject, details);
        
        // Both ADMIN and STAFF receive general warnings
        notifyAllUsers(WARNING, title, message, null);
        System.out.println("📢 General warning notification sent: " + message);
    }

    public void notifyLowStockWarning(StockItem item, int currentQuantity, int threshold) {
        String title = "🔻 Low Stock Warning";
        String message = String.format("%s is running low. Current: %d %s, Threshold: %d %s", 
            item.getName(), currentQuantity, item.getUnit(), threshold, item.getUnit());
        
        // Both ADMIN and STAFF receive low stock warnings
        notifyAllUsers(LOW_STOCK_WARNING, title, message, item.getId());
        System.out.println("📢 Low stock warning sent: " + message);
    }

    public void notifyAdequateStockLevel(StockItem item, int currentQuantity) {
        String title = "🟢 Adequate Stock Level";
        String message = String.format("%s is at adequate level. Current quantity: %d %s", 
            item.getName(), currentQuantity, item.getUnit());
        
        // Both ADMIN and STAFF receive adequate stock notifications
        notifyAllUsers(ADEQUATE_STOCK_LEVEL, title, message, item.getId());
        System.out.println("📢 Adequate stock notification sent: " + message);
    }

    public void notifyTransactionStockIssue(String itemName, int requestedQuantity, int availableQuantity, String transactionId) {
        String title = "🚨 Transaction Stock Issue";
        String message = String.format("Cannot complete transaction for %s. Requested: %d, Available: %d", 
            itemName, requestedQuantity, availableQuantity);
        
        // Both ADMIN and STAFF receive transaction issues
        notifyAllUsers(STOCK_ALERT, title, message, transactionId);
        System.out.println("📢 Transaction stock issue notification sent: " + message);
    }

    // Stock level monitoring for manual updates
    public void checkAndNotifyStockLevel(StockItem item, Integer previousQuantity) {
        if (item.getLowStockThreshold() == null || item.getAdequateStockThreshold() == null) {
            return;
        }

        int currentQuantity = item.getQuantity();
        int lowThreshold = item.getLowStockThreshold();
        int adequateThreshold = item.getAdequateStockThreshold();

        String currentStatus = determineStockStatus(currentQuantity, lowThreshold, adequateThreshold);
        String itemKey = item.getId();
        String lastStatus = lastStockStatus.get(itemKey);

        // Only notify if status changed
        if (lastStatus == null || !currentStatus.equals(lastStatus)) {
            sendStockStatusNotification(item, currentQuantity, currentStatus, lastStatus);
            lastStockStatus.put(itemKey, currentStatus);
        }
        
        // Handle large restocks (for significant quantity changes)
        // This will only trigger during manual updates, not during addStock operations
        if (previousQuantity != null && currentQuantity > previousQuantity && (currentQuantity - previousQuantity) >= 10) {
            String message = String.format("%s had a bulk restock. Added %d %s. New quantity: %d %s", 
                item.getName(), (currentQuantity - previousQuantity), item.getUnit(), currentQuantity, item.getUnit());
            notifyAllUsers(INVENTORY_UPDATE, "📦 Bulk Restock Completed", message, item.getId());
        }
    }

    public void notifyCurrentStockStatus(StockItem item) {
        int currentQuantity = item.getQuantity();
        int lowThreshold = item.getLowStockThreshold();
        int adequateThreshold = item.getAdequateStockThreshold();

        String currentStatus = determineStockStatus(currentQuantity, lowThreshold, adequateThreshold);
        String itemKey = item.getId();
        String lastStatus = lastStockStatus.get(itemKey);

        if (lastStatus == null || !currentStatus.equals(lastStatus)) {
            String message;
            String title;
            String type;

            if (currentQuantity == 0) {
                title = "🚨 Out of Stock Alert";
                message = String.format("%s is out of stock. Please restock immediately.", item.getName());
                type = STOCK_ALERT;
            } else if (currentQuantity <= lowThreshold) {
                title = "⚠️ Low Stock Alert";
                message = String.format("%s is running low. Current quantity: %d %s. Threshold: %d %s", 
                    item.getName(), currentQuantity, item.getUnit(), lowThreshold, item.getUnit());
                type = LOW_STOCK_WARNING;
            } else if (currentQuantity <= adequateThreshold) {
                title = "ℹ️ Adequate Stock";
                message = String.format("%s is at adequate level. Current quantity: %d %s.", 
                    item.getName(), currentQuantity, item.getUnit());
                type = ADEQUATE_STOCK_LEVEL;
            } else {
                title = "✅ Fully Stocked";
                message = String.format("%s is fully stocked. Current quantity: %d %s.", 
                    item.getName(), currentQuantity, item.getUnit());
                type = STOCK_INFO;
            }
            
            notifyAllUsers(type, title, message, item.getId());
            lastStockStatus.put(itemKey, currentStatus);
        }
    }

    public void triggerStockCheck() {
        System.out.println("🔍 Manual stock check triggered at: " + getCurrentManilaTime());
        autoCheckStockLevels();
    }

    @Scheduled(fixedRate = 300000) // 5 minutes
    public void initializeStockStatusTracking() {
        try {
            List<StockItem> allItems = stockRepository.findAll();
            int initialized = 0;
            
            for (StockItem item : allItems) {
                String itemKey = item.getId();
                if (!lastStockStatus.containsKey(itemKey)) {
                    int currentQuantity = item.getQuantity();
                    int lowThreshold = item.getLowStockThreshold() != null ? item.getLowStockThreshold() : 0;
                    int adequateThreshold = item.getAdequateStockThreshold() != null ? item.getAdequateStockThreshold() : 0;
                    
                    String currentStatus = determineStockStatus(currentQuantity, lowThreshold, adequateThreshold);
                    lastStockStatus.put(itemKey, currentStatus);
                    initialized++;
                }
            }
            
            if (initialized > 0) {
                System.out.println("📊 Initialized stock status tracking for " + initialized + " items");
            }
        } catch (Exception e) {
            System.err.println("❌ Error initializing stock status tracking: " + e.getMessage());
        }
    }

    // User notification management methods
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

    public void printStockStatusTracking() {
        System.out.println("📊 Current Stock Status Tracking:");
        lastStockStatus.forEach((itemId, status) -> {
            System.out.println("   Item: " + itemId + " → Status: " + status);
        });
    }
}