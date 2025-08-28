package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "transactions")
public class Transaction {

    @Id
    private String id; // ✅ MongoDB document ID

    private String invoiceNumber; // ✅ Timestamped traceable ID

    private String customerName;
    private String contact;

    private String serviceName;
    private Double servicePrice;
    private Integer serviceQuantity;

    private List<ServiceEntry> consumables;
    private Double totalPrice;

    private String paymentMethod;
    private Double amountGiven;
    private Double change;

    private LocalDateTime issueDate; // ✅ Explicit invoice issue date
    private LocalDateTime dueDate;   // ✅ Explicit due date
    private String staffId;          // ✅ Staff attribution for traceability

    @CreatedDate
    private LocalDateTime createdAt; // ✅ System timestamp

    public Transaction() {}

    public Transaction(String id,
                       String invoiceNumber,
                       String customerName, String contact,
                       String serviceName, Double servicePrice, Integer serviceQuantity,
                       List<ServiceEntry> consumables, Double totalPrice,
                       String paymentMethod, Double amountGiven, Double change,
                       LocalDateTime issueDate, LocalDateTime dueDate,
                       String staffId, LocalDateTime createdAt) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.customerName = customerName;
        this.contact = contact;
        this.serviceName = serviceName;
        this.servicePrice = servicePrice;
        this.serviceQuantity = serviceQuantity;
        this.consumables = consumables;
        this.totalPrice = totalPrice;
        this.paymentMethod = paymentMethod;
        this.amountGiven = amountGiven;
        this.change = change;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.staffId = staffId;
        this.createdAt = createdAt;
    }

    // Getters
    public String getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public String getCustomerName() { return customerName; }
    public String getContact() { return contact; }
    public String getServiceName() { return serviceName; }
    public Double getServicePrice() { return servicePrice; }
    public Integer getServiceQuantity() { return serviceQuantity; }
    public List<ServiceEntry> getConsumables() { return consumables; }
    public Double getTotalPrice() { return totalPrice; }
    public String getPaymentMethod() { return paymentMethod; }
    public Double getAmountGiven() { return amountGiven; }
    public Double getChange() { return change; }
    public LocalDateTime getIssueDate() { return issueDate; }
    public LocalDateTime getDueDate() { return dueDate; }
    public String getStaffId() { return staffId; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public void setContact(String contact) { this.contact = contact; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public void setServicePrice(Double servicePrice) { this.servicePrice = servicePrice; }
    public void setServiceQuantity(Integer serviceQuantity) { this.serviceQuantity = serviceQuantity; }
    public void setConsumables(List<ServiceEntry> consumables) { this.consumables = consumables; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setAmountGiven(Double amountGiven) { this.amountGiven = amountGiven; }
    public void setChange(Double change) { this.change = change; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}