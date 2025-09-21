package com.starwash.authservice.dto;

import java.time.LocalDateTime;

public class PendingGcashDto {
    private String id;
    private String invoiceNumber;
    private String customerName;
    private String contact;
    private Double totalPrice;
    private LocalDateTime createdAt;
    private String gcashReference;
    
    public PendingGcashDto() {}
    
    public PendingGcashDto(String id, String invoiceNumber, String customerName, 
                          String contact, Double totalPrice, LocalDateTime createdAt,
                          String gcashReference) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.customerName = customerName;
        this.contact = contact;
        this.totalPrice = totalPrice;
        this.createdAt = createdAt;
        this.gcashReference = gcashReference;
    }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    
    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public String getGcashReference() { return gcashReference; }
    public void setGcashReference(String gcashReference) { this.gcashReference = gcashReference; }
    
    @Override
    public String toString() {
        return "PendingGcashDto{" +
                "id='" + id + '\'' +
                ", invoiceNumber='" + invoiceNumber + '\'' +
                ", customerName='" + customerName + '\'' +
                ", contact='" + contact + '\'' +
                ", totalPrice=" + totalPrice +
                ", createdAt=" + createdAt +
                ", gcashReference='" + gcashReference + '\'' +
                '}';
    }
}