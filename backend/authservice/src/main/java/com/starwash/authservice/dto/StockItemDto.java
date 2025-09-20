package com.starwash.authservice.dto;

import java.time.LocalDateTime;

public class StockItemDto {

    private String id;
    private String name;
    private Integer quantity;
    private String unit;
    private Double price;

    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;
    private LocalDateTime lastRestock;
    private String updatedBy;

    private Integer previousQuantity;
    private Integer lastRestockAmount;

    private Integer lowStockThreshold;
    private Integer adequateStockThreshold;

    public StockItemDto() {}

    public StockItemDto(String id, String name, Integer quantity, String unit, Double price,
                        LocalDateTime createdAt, LocalDateTime lastUpdated,
                        LocalDateTime lastRestock, String updatedBy,
                        Integer previousQuantity, Integer lastRestockAmount,
                        Integer lowStockThreshold, Integer adequateStockThreshold) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
        this.price = price;
        this.createdAt = createdAt;
        this.lastUpdated = lastUpdated;
        this.lastRestock = lastRestock;
        this.updatedBy = updatedBy;
        this.previousQuantity = previousQuantity;
        this.lastRestockAmount = lastRestockAmount;
        this.lowStockThreshold = lowStockThreshold;
        this.adequateStockThreshold = adequateStockThreshold;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

    public LocalDateTime getLastRestock() { return lastRestock; }
    public void setLastRestock(LocalDateTime lastRestock) { this.lastRestock = lastRestock; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Integer getPreviousQuantity() { return previousQuantity; }
    public void setPreviousQuantity(Integer previousQuantity) { this.previousQuantity = previousQuantity; }

    public Integer getLastRestockAmount() { return lastRestockAmount; }
    public void setLastRestockAmount(Integer lastRestockAmount) { this.lastRestockAmount = lastRestockAmount; }

    public Integer getLowStockThreshold() { return lowStockThreshold; }
    public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }

    public Integer getAdequateStockThreshold() { return adequateStockThreshold; }
    public void setAdequateStockThreshold(Integer adequateStockThreshold) { this.adequateStockThreshold = adequateStockThreshold; }
}