package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String userId;
    private String type;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
    private String relatedEntityId;

    // Notification type constants
    public static final String TYPE_STOCK_ALERT = "stock_alert";
    public static final String TYPE_INVENTORY_UPDATE = "inventory_update";
    public static final String TYPE_STOCK_INFO = "stock_info";
    public static final String TYPE_LOAD_WASHED = "load_washed";
    public static final String TYPE_LOAD_DRIED = "load_dried";
    public static final String TYPE_NEW_LAUNDRY_SERVICE = "new_laundry_service";
    public static final String TYPE_LOAD_COMPLETED = "load_completed";

    // Manila timezone (GMT+8)
    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");

    public Notification() {
        // Set createdAt to Manila time by default
        this.createdAt = LocalDateTime.now(MANILA_ZONE);
        this.read = false;
    }

    public Notification(String userId, String type, String title, String message, String relatedEntityId) {
        this();
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.relatedEntityId = relatedEntityId;
    }

    // Getters and setters
    public String getId() { 
        return id; 
    }
    
    public void setId(String id) { 
        this.id = id; 
    }
    
    public String getUserId() { 
        return userId; 
    }
    
    public void setUserId(String userId) { 
        this.userId = userId; 
    }
    
    public String getType() { 
        return type; 
    }
    
    public void setType(String type) { 
        this.type = type; 
    }
    
    public String getTitle() { 
        return title; 
    }
    
    public void setTitle(String title) { 
        this.title = title; 
    }
    
    public String getMessage() { 
        return message; 
    }
    
    public void setMessage(String message) { 
        this.message = message; 
    }
    
    public boolean isRead() { 
        return read; 
    }
    
    public void setRead(boolean read) { 
        this.read = read; 
    }
    
    public LocalDateTime getCreatedAt() { 
        return createdAt; 
    }
    
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }
    
    public String getRelatedEntityId() { 
        return relatedEntityId; 
    }
    
    public void setRelatedEntityId(String relatedEntityId) { 
        this.relatedEntityId = relatedEntityId; 
    }

    // Utility methods to check notification type
    public boolean isStockAlert() {
        return TYPE_STOCK_ALERT.equals(this.type);
    }
    
    public boolean isInventoryUpdate() {
        return TYPE_INVENTORY_UPDATE.equals(this.type);
    }
    
    public boolean isStockInfo() {
        return TYPE_STOCK_INFO.equals(this.type);
    }
    
    public boolean isLoadWashed() {
        return TYPE_LOAD_WASHED.equals(this.type);
    }
    
    public boolean isLoadDried() {
        return TYPE_LOAD_DRIED.equals(this.type);
    }
    
    public boolean isNewLaundryService() {
        return TYPE_NEW_LAUNDRY_SERVICE.equals(this.type);
    }
    
    public boolean isLoadCompleted() {
        return TYPE_LOAD_COMPLETED.equals(this.type);
    }
    
    public boolean isLaundryNotification() {
        return isLoadWashed() || isLoadDried() || isNewLaundryService() || isLoadCompleted();
    }

    @Override
    public String toString() {
        return "Notification{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", type='" + type + '\'' +
                ", title='" + title + '\'' +
                ", message='" + message + '\'' +
                ", read=" + read +
                ", createdAt=" + createdAt +
                ", relatedEntityId='" + relatedEntityId + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Notification that = (Notification) o;

        return id != null ? id.equals(that.id) : that.id == null;
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
}