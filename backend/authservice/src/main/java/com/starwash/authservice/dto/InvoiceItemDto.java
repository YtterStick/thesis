package com.starwash.authservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public class InvoiceItemDto {

    private String id;
    private String invoiceNumber; // ✅ Required for frontend
    private String transactionId;
    private LocalDateTime issueDate;
    private LocalDateTime dueDate;
    private String customerName;
    private List<ServiceEntryDto> services;
    private Double subtotal;
    private Double tax;
    private Double discount;
    private Double total;
    private String paymentMethod;
    private boolean paid;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;
    private InvoiceSettingsDto settings;

    public InvoiceItemDto() {}

    public InvoiceItemDto(String id, String invoiceNumber, String transactionId,
                          LocalDateTime issueDate, LocalDateTime dueDate,
                          String customerName, List<ServiceEntryDto> services,
                          Double subtotal, Double tax, Double discount, Double total,
                          String paymentMethod, boolean paid,
                          String createdBy, LocalDateTime createdAt,
                          LocalDateTime lastUpdated, InvoiceSettingsDto settings) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.transactionId = transactionId;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.customerName = customerName;
        this.services = services;
        this.subtotal = subtotal;
        this.tax = tax;
        this.discount = discount;
        this.total = total;
        this.paymentMethod = paymentMethod;
        this.paid = paid;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.lastUpdated = lastUpdated;
        this.settings = settings;
    }

    // ✅ Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public List<ServiceEntryDto> getServices() { return services; }
    public void setServices(List<ServiceEntryDto> services) { this.services = services; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTax() { return tax; }
    public void setTax(Double tax) { this.tax = tax; }

    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public boolean isPaid() { return paid; }
    public void setPaid(boolean paid) { this.paid = paid; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

    public InvoiceSettingsDto getSettings() { return settings; }
    public void setSettings(InvoiceSettingsDto settings) { this.settings = settings; }
}