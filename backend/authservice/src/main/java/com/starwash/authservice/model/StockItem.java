package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "stock_items")
public class StockItem {

    @Id
    private String id;

    private String name;
    private int quantity;
    private String unit;
    private double price;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime lastUpdated;

    private LocalDateTime lastRestock;
    private String updatedBy;

    private Integer previousQuantity;
    private Integer lastRestockAmount;

    private Integer lowStockThreshold;
    private Integer adequateStockThreshold;

    public StockItem() {}

    public StockItem(String name, int quantity, String unit, double price) {
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
        this.price = price;
        this.createdAt = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
        this.lastRestock = LocalDateTime.now();
    }

    public String getStockStatus() {
        if (lowStockThreshold == null || adequateStockThreshold == null) return "Unknown";
        if (quantity <= lowStockThreshold) return "Low";
        if (quantity <= adequateStockThreshold) return "Adequate";
        return "Stocked";
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public int getQuantity() { return quantity; }
    public String getUnit() { return unit; }
    public double getPrice() { return price; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public LocalDateTime getLastRestock() { return lastRestock; }
    public String getUpdatedBy() { return updatedBy; }
    public Integer getPreviousQuantity() { return previousQuantity; }
    public Integer getLastRestockAmount() { return lastRestockAmount; }
    public Integer getLowStockThreshold() { return lowStockThreshold; }
    public Integer getAdequateStockThreshold() { return adequateStockThreshold; }

    public void setName(String name) { this.name = name; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public void setUnit(String unit) { this.unit = unit; }
    public void setPrice(double price) { this.price = price; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
    public void setLastRestock(LocalDateTime lastRestock) { this.lastRestock = lastRestock; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public void setPreviousQuantity(Integer previousQuantity) { this.previousQuantity = previousQuantity; }
    public void setLastRestockAmount(Integer lastRestockAmount) { this.lastRestockAmount = lastRestockAmount; }
    public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }
    public void setAdequateStockThreshold(Integer adequateStockThreshold) { this.adequateStockThreshold = adequateStockThreshold; }
}