package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "transactions")
public class Transaction {

    @Id
    private String id;

    private String receiptCode; // ✅ Printable receipt ID

    private String customerName;
    private String contact;

    private String serviceName;
    private Double servicePrice;
    private Integer serviceQuantity;

    private List<ServiceEntry> consumables;
    private Double totalPrice;

    private String status;
    private Double amountGiven;
    private Double change;

    @CreatedDate
    private LocalDateTime createdAt;

    public Transaction() {}

    public Transaction(String customerName, String contact,
                       String serviceName, Double servicePrice, Integer serviceQuantity,
                       List<ServiceEntry> consumables, Double totalPrice,
                       String status, Double amountGiven, Double change,
                       LocalDateTime createdAt) {
        this.customerName = customerName;
        this.contact = contact;
        this.serviceName = serviceName;
        this.servicePrice = servicePrice;
        this.serviceQuantity = serviceQuantity;
        this.consumables = consumables;
        this.totalPrice = totalPrice;
        this.status = status;
        this.amountGiven = amountGiven;
        this.change = change;
        this.createdAt = createdAt;
    }

    // Getters
    public String getId() { return id; }
    public String getReceiptCode() { return receiptCode; }
    public String getCustomerName() { return customerName; }
    public String getContact() { return contact; }
    public String getServiceName() { return serviceName; }
    public Double getServicePrice() { return servicePrice; }
    public Integer getServiceQuantity() { return serviceQuantity; }
    public List<ServiceEntry> getConsumables() { return consumables; }
    public Double getTotalPrice() { return totalPrice; }
    public String getStatus() { return status; }
    public Double getAmountGiven() { return amountGiven; }
    public Double getChange() { return change; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setReceiptCode(String receiptCode) { this.receiptCode = receiptCode; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public void setContact(String contact) { this.contact = contact; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public void setServicePrice(Double servicePrice) { this.servicePrice = servicePrice; }
    public void setServiceQuantity(Integer serviceQuantity) { this.serviceQuantity = serviceQuantity; }
    public void setConsumables(List<ServiceEntry> consumables) { this.consumables = consumables; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
    public void setStatus(String status) { this.status = status; }
    public void setAmountGiven(Double amountGiven) { this.amountGiven = amountGiven; }
    public void setChange(Double change) { this.change = change; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}