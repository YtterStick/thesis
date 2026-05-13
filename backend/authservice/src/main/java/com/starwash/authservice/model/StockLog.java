package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "stock_logs")
public class StockLog {

    @Id
    private String id;
    private String itemId;
    private String itemName;
    private String type; // ADD, DEDUCT, UPDATE, INITIAL
    private int amount;
    private int previousQuantity;
    private int newQuantity;
    private LocalDateTime timestamp;
    private String updatedBy;
    private String notes;

    public StockLog() {}

    public StockLog(String itemId, String itemName, String type, int amount, int previousQuantity, int newQuantity, String updatedBy, String notes) {
        this.itemId = itemId;
        this.itemName = itemName;
        this.type = type;
        this.amount = amount;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;
        this.updatedBy = updatedBy;
        this.notes = notes;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
    public int getPreviousQuantity() { return previousQuantity; }
    public void setPreviousQuantity(int previousQuantity) { this.previousQuantity = previousQuantity; }
    public int getNewQuantity() { return newQuantity; }
    public void setNewQuantity(int newQuantity) { this.newQuantity = newQuantity; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
