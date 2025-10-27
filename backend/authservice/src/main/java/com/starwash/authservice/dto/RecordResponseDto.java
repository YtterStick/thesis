package com.starwash.authservice.dto;

import java.time.LocalDateTime;

public class RecordResponseDto {

    private String id;
    private String invoiceNumber;
    private String customerName;
    private String contact;
    private String serviceName;
    private int loads;
    private String detergent;
    private String fabric; 
    private double totalPrice;
    private boolean disposed;
    private String paymentMethod;  
    private String pickupStatus;    
    private boolean washed;
    private boolean expired;
    private LocalDateTime createdAt;

    public RecordResponseDto() {}

    public RecordResponseDto(String id, String invoiceNumber, String customerName, String contact, String serviceName, int loads,
                             String detergent, String fabric, double totalPrice,
                             String paymentMethod, String pickupStatus, boolean washed,
                             boolean expired, LocalDateTime createdAt) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.customerName = customerName;
        this.contact = contact;
        this.serviceName = serviceName;
        this.loads = loads;
        this.detergent = detergent;
        this.fabric = fabric;
        this.totalPrice = totalPrice;
        this.paymentMethod = paymentMethod;
        this.pickupStatus = pickupStatus;
        this.washed = washed;
        this.expired = expired;
        this.createdAt = createdAt;
    }

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

    public int getLoads() { return loads; }
    public void setLoads(int loads) { this.loads = loads; }

    public String getDetergent() { return detergent; }
    public void setDetergent(String detergent) { this.detergent = detergent; }

    public String getFabric() { return fabric; }
    public void setFabric(String fabric) { this.fabric = fabric; }

    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPickupStatus() { return pickupStatus; }
    public void setPickupStatus(String pickupStatus) { this.pickupStatus = pickupStatus; }

    public boolean isDisposed() { return disposed; }
    public void setDisposed(boolean disposed) { this.disposed = disposed; }

    public boolean isWashed() { return washed; }
    public void setWashed(boolean washed) { this.washed = washed; }

    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}