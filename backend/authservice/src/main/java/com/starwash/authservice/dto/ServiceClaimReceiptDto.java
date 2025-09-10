package com.starwash.authservice.dto;

import java.time.LocalDateTime;

public class ServiceClaimReceiptDto {
    private String claimReceiptNumber;
    private String originalInvoiceNumber;
    private String customerName;
    private String contact;
    private String serviceType;
    private int totalLoads;
    private LocalDateTime claimDate;
    private String claimedByStaff;
    private FormatSettingsDto formatSettings;

    public ServiceClaimReceiptDto() {}

    public ServiceClaimReceiptDto(String claimReceiptNumber, String originalInvoiceNumber, 
                                 String customerName, String contact, String serviceType, 
                                 int totalLoads, LocalDateTime claimDate, String claimedByStaff,
                                 FormatSettingsDto formatSettings) {
        this.claimReceiptNumber = claimReceiptNumber;
        this.originalInvoiceNumber = originalInvoiceNumber;
        this.customerName = customerName;
        this.contact = contact;
        this.serviceType = serviceType;
        this.totalLoads = totalLoads;
        this.claimDate = claimDate;
        this.claimedByStaff = claimedByStaff;
        this.formatSettings = formatSettings;
    }

    // Getters and setters
    public String getClaimReceiptNumber() { return claimReceiptNumber; }
    public void setClaimReceiptNumber(String claimReceiptNumber) { this.claimReceiptNumber = claimReceiptNumber; }
    
    public String getOriginalInvoiceNumber() { return originalInvoiceNumber; }
    public void setOriginalInvoiceNumber(String originalInvoiceNumber) { this.originalInvoiceNumber = originalInvoiceNumber; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    
    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    
    public int getTotalLoads() { return totalLoads; }
    public void setTotalLoads(int totalLoads) { this.totalLoads = totalLoads; }
    
    public LocalDateTime getClaimDate() { return claimDate; }
    public void setClaimDate(LocalDateTime claimDate) { this.claimDate = claimDate; }
    
    public String getClaimedByStaff() { return claimedByStaff; }
    public void setClaimedByStaff(String claimedByStaff) { this.claimedByStaff = claimedByStaff; }
    
    public FormatSettingsDto getFormatSettings() { return formatSettings; }
    public void setFormatSettings(FormatSettingsDto formatSettings) { this.formatSettings = formatSettings; }
}