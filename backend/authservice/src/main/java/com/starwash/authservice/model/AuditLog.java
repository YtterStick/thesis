package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private String id;
    
    @Indexed
    private String username;
    
    @Indexed
    private String action;
    
    private String entityType;
    private String entityId;
    private String description;
    private Object oldValues;
    private Object newValues;
    private String ipAddress;
    
    @Indexed
    private LocalDateTime timestamp;

    // Constructors
    public AuditLog() {
        // Default constructor sets Manila time
        this.timestamp = LocalDateTime.now(ZoneId.of("Asia/Manila"));
    }

    public AuditLog(String username, String action, String entityType, String entityId, 
                   String description, String ipAddress) {
        this.username = username;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.description = description;
        this.ipAddress = ipAddress;
        // Set Manila time by default
        this.timestamp = LocalDateTime.now(ZoneId.of("Asia/Manila"));
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Object getOldValues() { return oldValues; }
    public void setOldValues(Object oldValues) { this.oldValues = oldValues; }

    public Object getNewValues() { return newValues; }
    public void setNewValues(Object newValues) { this.newValues = newValues; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    // Helper method to get timestamp as ZonedDateTime in Manila time
    public ZonedDateTime getTimestampAsManilaTime() {
        return this.timestamp.atZone(ZoneId.of("Asia/Manila"));
    }

    @Override
    public String toString() {
        return String.format(
            "AuditLog{id='%s', username='%s', action='%s', timestamp=%s, description='%s'}",
            id, username, action, timestamp, description
        );
    }
}