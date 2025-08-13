package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "invoices")
public class InvoiceItem {

    @Id
    private String id;

    private String invoiceNumber;       // e.g. INV-2025-0001
    private String transactionId;       // Link to transaction
    private LocalDateTime issueDate;    // When invoice was issued
    private LocalDateTime dueDate;      // For unpaid invoices

    private String customerName;
    private List<ServiceEntry> services;

    private double subtotal;            // Before tax/discount
    private double tax;
    private double discount;
    private double total;

    private String paymentMethod;       // Optional: only if paid
    private String createdBy;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime lastUpdated;

    public InvoiceItem() {}

    public InvoiceItem(String id, String invoiceNumber, String transactionId,
                       LocalDateTime issueDate, LocalDateTime dueDate,
                       String customerName, List<ServiceEntry> services,
                       double subtotal, double tax, double discount, double total,
                       String paymentMethod, String createdBy,
                       LocalDateTime createdAt, LocalDateTime lastUpdated) {
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
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.lastUpdated = lastUpdated;
    }

    // Getters
    public String getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public String getTransactionId() { return transactionId; }
    public LocalDateTime getIssueDate() { return issueDate; }
    public LocalDateTime getDueDate() { return dueDate; }
    public String getCustomerName() { return customerName; }
    public List<ServiceEntry> getServices() { return services; }
    public double getSubtotal() { return subtotal; }
    public double getTax() { return tax; }
    public double getDiscount() { return discount; }
    public double getTotal() { return total; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public void setServices(List<ServiceEntry> services) { this.services = services; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }
    public void setTax(double tax) { this.tax = tax; }
    public void setDiscount(double discount) { this.discount = discount; }
    public void setTotal(double total) { this.total = total; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}