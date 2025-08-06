package com.starwash.authservice.dto;

import java.time.LocalDateTime;

public class StockItemDto {

    private String id;
    private String name;
    private int quantity;
    private String unit;

    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;
    private LocalDateTime lastRestock;

    private String updatedBy;

    // Constructors
    public StockItemDto() {}

    public StockItemDto(String id, String name, int quantity, String unit,
                        LocalDateTime createdAt, LocalDateTime lastUpdated,
                        LocalDateTime lastRestock, String updatedBy) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
        this.createdAt = createdAt;
        this.lastUpdated = lastUpdated;
        this.lastRestock = lastRestock; 
        this.updatedBy = updatedBy;
    }

    // Getters & Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public LocalDateTime getLastRestock() {
        return lastRestock;
    }

    public void setLastRestock(LocalDateTime lastRestock) {
        this.lastRestock = lastRestock;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}