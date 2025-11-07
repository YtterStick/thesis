package com.starwash.authservice.dto;

import com.starwash.authservice.model.LaundryJob.LoadAssignment;

import java.time.LocalDateTime;
import java.util.List;

public class ServiceTrackingDto {

    // Transaction/Customer Information (shown first)
    private String invoiceNumber;
    private String customerName;
    private String contact;
    private String serviceName;
    private Double servicePrice;
    private Integer loads;
    private Double totalPrice;
    private String paymentMethod;
    private LocalDateTime issueDate;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private String staffId;

    // ✅ ADDED: Amount Given and Change fields
    private Double amountGiven;
    private Double change;

    // Consumables
    private Integer detergentQty;
    private Integer fabricQty;

    // Laundry Job Progress Information
    private String laundryJobId;
    private List<LoadAssignment> loadAssignments;
    private String pickupStatus;
    private Integer currentStep;
    private List<String> statusFlow;
    private String laundryProcessedBy;
    private boolean expired;
    private boolean disposed;

    // Constructors
    public ServiceTrackingDto() {}

    public ServiceTrackingDto(String invoiceNumber, String customerName, String contact, 
                             String serviceName, Double servicePrice, Integer loads, 
                             Double totalPrice, String paymentMethod, 
                             LocalDateTime issueDate, LocalDateTime dueDate, 
                             LocalDateTime createdAt, String staffId,
                             Integer detergentQty, Integer fabricQty) {
        this.invoiceNumber = invoiceNumber;
        this.customerName = customerName;
        this.contact = contact;
        this.serviceName = serviceName;
        this.servicePrice = servicePrice;
        this.loads = loads;
        this.totalPrice = totalPrice;
        this.paymentMethod = paymentMethod;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.createdAt = createdAt;
        this.staffId = staffId;
        this.detergentQty = detergentQty;
        this.fabricQty = fabricQty;
    }

    // ✅ UPDATED: Constructor with amountGiven and change
    public ServiceTrackingDto(String invoiceNumber, String customerName, String contact, 
                             String serviceName, Double servicePrice, Integer loads, 
                             Double totalPrice, String paymentMethod, 
                             LocalDateTime issueDate, LocalDateTime dueDate, 
                             LocalDateTime createdAt, String staffId,
                             Double amountGiven, Double change,
                             Integer detergentQty, Integer fabricQty) {
        this.invoiceNumber = invoiceNumber;
        this.customerName = customerName;
        this.contact = contact;
        this.serviceName = serviceName;
        this.servicePrice = servicePrice;
        this.loads = loads;
        this.totalPrice = totalPrice;
        this.paymentMethod = paymentMethod;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.createdAt = createdAt;
        this.staffId = staffId;
        this.amountGiven = amountGiven;
        this.change = change;
        this.detergentQty = detergentQty;
        this.fabricQty = fabricQty;
    }

    // Getters and Setters
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

    public Integer getLoads() { return loads; }
    public void setLoads(Integer loads) { this.loads = loads; }

    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    // ✅ ADDED: Getters and Setters for amountGiven and change
    public Double getAmountGiven() { return amountGiven; }
    public void setAmountGiven(Double amountGiven) { this.amountGiven = amountGiven; }

    public Double getChange() { return change; }
    public void setChange(Double change) { this.change = change; }

    public Integer getDetergentQty() { return detergentQty; }
    public void setDetergentQty(Integer detergentQty) { this.detergentQty = detergentQty; }

    public Integer getFabricQty() { return fabricQty; }
    public void setFabricQty(Integer fabricQty) { this.fabricQty = fabricQty; }

    public String getLaundryJobId() { return laundryJobId; }
    public void setLaundryJobId(String laundryJobId) { this.laundryJobId = laundryJobId; }

    public List<LoadAssignment> getLoadAssignments() { return loadAssignments; }
    public void setLoadAssignments(List<LoadAssignment> loadAssignments) { this.loadAssignments = loadAssignments; }

    public String getPickupStatus() { return pickupStatus; }
    public void setPickupStatus(String pickupStatus) { this.pickupStatus = pickupStatus; }

    public Integer getCurrentStep() { return currentStep; }
    public void setCurrentStep(Integer currentStep) { this.currentStep = currentStep; }

    public List<String> getStatusFlow() { return statusFlow; }
    public void setStatusFlow(List<String> statusFlow) { this.statusFlow = statusFlow; }

    public String getLaundryProcessedBy() { return laundryProcessedBy; }
    public void setLaundryProcessedBy(String laundryProcessedBy) { this.laundryProcessedBy = laundryProcessedBy; }

    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }

    public boolean isDisposed() { return disposed; }
    public void setDisposed(boolean disposed) { this.disposed = disposed; }

    // ✅ ADDED: toString method for debugging
    @Override
    public String toString() {
        return "ServiceTrackingDto{" +
                "invoiceNumber='" + invoiceNumber + '\'' +
                ", customerName='" + customerName + '\'' +
                ", contact='" + contact + '\'' +
                ", serviceName='" + serviceName + '\'' +
                ", servicePrice=" + servicePrice +
                ", loads=" + loads +
                ", totalPrice=" + totalPrice +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", amountGiven=" + amountGiven +
                ", change=" + change +
                ", detergentQty=" + detergentQty +
                ", fabricQty=" + fabricQty +
                ", pickupStatus='" + pickupStatus + '\'' +
                ", expired=" + expired +
                ", disposed=" + disposed +
                '}';
    }
}