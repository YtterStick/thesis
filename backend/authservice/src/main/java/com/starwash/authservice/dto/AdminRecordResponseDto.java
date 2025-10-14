package com.starwash.authservice.dto;

import java.time.LocalDateTime;

public class AdminRecordResponseDto {
    private String id;
    private String invoiceNumber; // Add this field
    private String customerName;
    private String contact;
    private String serviceName;
    private int loads;
    private String detergent;
    private String fabric;
    private double totalPrice;
    private String paymentMethod;
    private String pickupStatus;
    private String laundryStatus;
    private String processedByStaff;
    private boolean paid;
    private boolean expired;
    private LocalDateTime createdAt;
    private Boolean gcashVerified;
    private String laundryProcessedBy;
    private String claimProcessedBy;
    private boolean disposed;
    private String disposedBy;
    private int unwashedLoadsCount;

    public AdminRecordResponseDto() {}
    
    public AdminRecordResponseDto(String id, String invoiceNumber, String customerName, String contact, String serviceName, 
                                 int loads, String detergent, String fabric, double totalPrice,
                                 String paymentMethod, String pickupStatus, String laundryStatus,
                                 String processedByStaff, boolean paid, boolean expired, 
                                 LocalDateTime createdAt, Boolean gcashVerified,
                                 String laundryProcessedBy, String claimProcessedBy,
                                 boolean disposed, String disposedBy, int unwashedLoadsCount) {
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
        this.laundryStatus = laundryStatus;
        this.processedByStaff = processedByStaff;
        this.paid = paid;
        this.expired = expired;
        this.createdAt = createdAt;
        this.gcashVerified = gcashVerified;
        this.laundryProcessedBy = laundryProcessedBy;
        this.claimProcessedBy = claimProcessedBy;
        this.disposed = disposed;
        this.disposedBy = disposedBy;
        this.unwashedLoadsCount = unwashedLoadsCount;
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
    
    public String getLaundryStatus() { return laundryStatus; }
    public void setLaundryStatus(String laundryStatus) { this.laundryStatus = laundryStatus; }
    
    public String getProcessedByStaff() { return processedByStaff; }
    public void setProcessedByStaff(String processedByStaff) { this.processedByStaff = processedByStaff; }
    
    public boolean isPaid() { return paid; }
    public void setPaid(boolean paid) { this.paid = paid; }
    
    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Boolean getGcashVerified() { return gcashVerified; }
    public void setGcashVerified(Boolean gcashVerified) { this.gcashVerified = gcashVerified; }
    
    public String getLaundryProcessedBy() { return laundryProcessedBy; }
    public void setLaundryProcessedBy(String laundryProcessedBy) { this.laundryProcessedBy = laundryProcessedBy; }
    
    public String getClaimProcessedBy() { return claimProcessedBy; }
    public void setClaimProcessedBy(String claimProcessedBy) { this.claimProcessedBy = claimProcessedBy; }
    
    public boolean isDisposed() { return disposed; }
    public void setDisposed(boolean disposed) { this.disposed = disposed; }
    
    public String getDisposedBy() { return disposedBy; }
    public void setDisposedBy(String disposedBy) { this.disposedBy = disposedBy; }
    
    public int getUnwashedLoadsCount() { return unwashedLoadsCount; }
    public void setUnwashedLoadsCount(int unwashedLoadsCount) { this.unwashedLoadsCount = unwashedLoadsCount; }
}