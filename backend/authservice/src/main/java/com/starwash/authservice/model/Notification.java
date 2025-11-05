package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "notifications")
public class Notification {
    
    @Id
    private String id;
    
    private String userId;
    private String type;
    private String title;
    private String message;
    private String relatedEntityId;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

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

    public Notification() {}

    public Notification(String userId, String type, String title, String message, String relatedEntityId) {
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.relatedEntityId = relatedEntityId;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(String relatedEntityId) { this.relatedEntityId = relatedEntityId; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { 
        this.read = read;
        if (read && this.readAt == null) {
            this.readAt = LocalDateTime.now();
        }
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }

    @Override
    public String toString() {
        return "Notification{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", type='" + type + '\'' +
                ", title='" + title + '\'' +
                ", message='" + message + '\'' +
                ", relatedEntityId='" + relatedEntityId + '\'' +
                ", read=" + read +
                ", createdAt=" + createdAt +
                '}';
    }
}