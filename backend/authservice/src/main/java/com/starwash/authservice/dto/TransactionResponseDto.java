package com.starwash.authservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TransactionResponseDto {

    private String id;

    private String customerName;
    private String contact;

    private ServiceEntryDto service;
    private List<ServiceEntryDto> consumables;

    private Double totalPrice;
    private String status;
    private Double amountGiven;
    private Double change;

    private LocalDateTime createdAt;
    private LocalDateTime issueDate;
    private LocalDateTime dueDate;

    public TransactionResponseDto() {}

    public TransactionResponseDto(String id,
                                  String customerName, String contact,
                                  ServiceEntryDto service, List<ServiceEntryDto> consumables,
                                  Double totalPrice, String status,
                                  Double amountGiven, Double change,
                                  LocalDateTime createdAt,
                                  LocalDateTime issueDate,
                                  LocalDateTime dueDate) {
        this.id = id;
        this.customerName = customerName;
        this.contact = contact;
        this.service = service;
        this.consumables = consumables;
        this.totalPrice = totalPrice;
        this.status = status;
        this.amountGiven = amountGiven;
        this.change = change;
        this.createdAt = createdAt;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
    }

    public String getId() { return id; }
    public String getCustomerName() { return customerName; }
    public String getContact() { return contact; }
    public ServiceEntryDto getService() { return service; }
    public List<ServiceEntryDto> getConsumables() { return consumables; }
    public Double getTotalPrice() { return totalPrice; }
    public String getStatus() { return status; }
    public Double getAmountGiven() { return amountGiven; }
    public Double getChange() { return change; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getIssueDate() { return issueDate; }
    public LocalDateTime getDueDate() { return dueDate; }

    public void setId(String id) { this.id = id; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public void setContact(String contact) { this.contact = contact; }
    public void setService(ServiceEntryDto service) { this.service = service; }
    public void setConsumables(List<ServiceEntryDto> consumables) { this.consumables = consumables; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }
    public void setStatus(String status) { this.status = status; }
    public void setAmountGiven(Double amountGiven) { this.amountGiven = amountGiven; }
    public void setChange(Double change) { this.change = change; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
}