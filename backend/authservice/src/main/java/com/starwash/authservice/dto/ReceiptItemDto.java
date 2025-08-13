package com.starwash.authservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ReceiptItemDto {

    private String id;
    private String customerName;
    private List<ServiceEntryDto> services;
    private Double total;
    private String paymentMethod;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;
    private ReceiptSettingsDto settings;

    public ReceiptItemDto() {}

    public ReceiptItemDto(String id, String customerName, List<ServiceEntryDto> services,
                          Double total, String paymentMethod,
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

    public ReceiptItemDto(String id, String customerName, List<ServiceEntryDto> services,
                          Double total, String paymentMethod,
                          String createdBy, LocalDateTime createdAt, LocalDateTime lastUpdated,
                          ReceiptSettingsDto settings) {
        this(id, customerName, services, total, paymentMethod, createdBy, createdAt, lastUpdated);
        this.settings = settings;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public List<ServiceEntryDto> getServices() {
        return services;
    }

    public void setServices(List<ServiceEntryDto> services) {
        this.services = services;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
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

    public ReceiptSettingsDto getSettings() {
        return settings;
    }

    public void setSettings(ReceiptSettingsDto settings) {
        this.settings = settings;
    }
}