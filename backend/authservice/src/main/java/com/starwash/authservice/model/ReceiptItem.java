package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "receipts")
public class ReceiptItem {

    @Id
    private String id;

    private String customerName;
    private List<ServiceEntry> services;
    private double total;
    private String paymentMethod;
    private String createdBy;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime lastUpdated;

    public ReceiptItem() {}

    public ReceiptItem(String id, String customerName, List<ServiceEntry> services,
                       double total, String paymentMethod,
                       String createdBy, LocalDateTime createdAt, LocalDateTime lastUpdated) {
        this.id = id;
        this.customerName = customerName;
        this.services = services;
        this.total = total;
        this.paymentMethod = paymentMethod;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.lastUpdated = lastUpdated;
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getCustomerName() {
        return customerName;
    }

    public List<ServiceEntry> getServices() {
        return services;
    }

    public double getTotal() {
        return total;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public void setServices(List<ServiceEntry> services) {
        this.services = services;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}