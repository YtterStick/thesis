package com.starwash.authservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public class InvoiceItemDto {

    private String id;

    private String invoiceNumber;
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

    // ✅ Derived from linked transaction
    private Boolean isPaid;

    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;

    private InvoiceSettingsDto settings;

    public InvoiceItemDto() {}

    public InvoiceItemDto(String id, String invoiceNumber, String transactionId,
                          LocalDateTime issueDate, LocalDateTime dueDate,
                          String customerName, List<ServiceEntryDto> services,
                          Double subtotal, Double tax, Double discount, Double total,
                          String paymentMethod, Boolean isPaid,
                          String createdBy, LocalDateTime createdAt, LocalDateTime lastUpdated) {
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
        this.isPaid = isPaid;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.lastUpdated = lastUpdated;
    }

    public InvoiceItemDto(String id, String invoiceNumber, String transactionId,
                          LocalDateTime issueDate, LocalDateTime dueDate,
                          String customerName, List<ServiceEntryDto> services,
                          Double subtotal, Double tax, Double discount, Double total,
                          String paymentMethod, Boolean isPaid,
                          String createdBy, LocalDateTime createdAt, LocalDateTime lastUpdated,
                          InvoiceSettingsDto settings) {
        this(id, invoiceNumber, transactionId, issueDate, dueDate,
             customerName, services, subtotal, tax, discount, total,
             paymentMethod, isPaid, createdBy, createdAt, lastUpdated);
        this.settings = settings;
    }

    // Getters
    public String getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public String getTransactionId() { return transactionId; }
    public LocalDateTime getIssueDate() { return issueDate; }
    public LocalDateTime getDueDate() { return dueDate; }
    public String getCustomerName() { return customerName; }
    public List<ServiceEntryDto> getServices() { return services; }
    public Double getSubtotal() { return subtotal; }
    public Double getTax() { return tax; }
    public Double getDiscount() { return discount; }
    public Double getTotal() { return total; }
    public String getPaymentMethod() { return paymentMethod; }
    public Boolean getIsPaid() { return isPaid; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public InvoiceSettingsDto getSettings() { return settings; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public void setServices(List<ServiceEntryDto> services) { this.services = services; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    public void setTax(Double tax) { this.tax = tax; }
    public void setDiscount(Double discount) { this.discount = discount; }
    public void setTotal(Double total) { this.total = total; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setIsPaid(Boolean isPaid) { this.isPaid = isPaid; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
    public void setSettings(InvoiceSettingsDto settings) { this.settings = settings; }
}