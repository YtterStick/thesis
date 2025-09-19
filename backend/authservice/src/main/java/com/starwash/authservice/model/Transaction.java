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

    private String invoiceNumber;

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

    private LocalDateTime issueDate; //invoice
    private LocalDateTime dueDate;   // due date
    private String staffId;

    private Boolean gcashVerified;
    
    @CreatedDate
    private LocalDateTime createdAt;

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
        
        // Ensure dueDate is never null and includes time component
        if (dueDate != null) {
            this.dueDate = dueDate;
        } else if (issueDate != null) {
            // Set to 3 days from issue date at 5:00 PM
            this.dueDate = issueDate.plusDays(3).withHour(17).withMinute(0).withSecond(0);
        } else {
            // Set to 3 days from now at 5:00 PM
            this.dueDate = LocalDateTime.now().plusDays(3).withHour(17).withMinute(0).withSecond(0);
        }
        
        this.staffId = staffId;
        this.createdAt = createdAt;
        this.gcashVerified = "GCash".equals(paymentMethod) ? false : null;
    }

    // Getters and Setters (unchanged)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    
    public Double getServicePrice() { return servicePrice; }
    public void setServicePrice(Double servicePrice) { this.servicePrice = servicePrice; }
    
    public Integer getServiceQuantity() { return serviceQuantity; }
    public void setServiceQuantity(Integer serviceQuantity) { this.serviceQuantity = serviceQuantity; }
    
    public List<ServiceEntry> getConsumables() { return consumables; }
    public void setConsumables(List<ServiceEntry> consumables) { this.consumables = consumables; }
    
    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { 
        this.paymentMethod = paymentMethod; 
        if ("GCash".equals(paymentMethod) && this.gcashVerified == null) {
            this.gcashVerified = false;
        } else if (!"GCash".equals(paymentMethod)) {
            this.gcashVerified = null;
        }
    }
    
    public Double getAmountGiven() { return amountGiven; }
    public void setAmountGiven(Double amountGiven) { this.amountGiven = amountGiven; }
    
    public Double getChange() { return change; }
    public void setChange(Double change) { this.change = change; }
    
    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }
    
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Boolean getGcashVerified() { return gcashVerified; }
    public void setGcashVerified(Boolean gcashVerified) { this.gcashVerified = gcashVerified; }
}