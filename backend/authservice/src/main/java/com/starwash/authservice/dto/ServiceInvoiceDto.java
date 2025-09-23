package com.starwash.authservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ServiceInvoiceDto {

    private String invoiceNumber;
    private String staffId;
    private String customerName;
    private String contact;
    private ServiceEntryDto service;
    private List<ServiceEntryDto> consumables;
    private Double subtotal;
    private Double tax;
    private Double discount;
    private Double total;
    private String paymentMethod;
    
    // ✅ ADD THESE TWO FIELDS
    private Double amountGiven;
    private Double change;
    
    private LocalDateTime issueDate;
    private LocalDateTime dueDate;
    private FormatSettingsDto formatSettings;
    private int detergentQty;
    private int fabricQty;
    private int plasticQty;
    private int loads;

    public ServiceInvoiceDto() {}

    public ServiceInvoiceDto(String invoiceNumber,
                             String customerName, String contact,
                             ServiceEntryDto service, List<ServiceEntryDto> consumables,
                             Double subtotal, Double tax, Double discount, Double total,
                             String paymentMethod,
                             Double amountGiven, Double change, // ✅ ADD THESE
                             LocalDateTime issueDate, LocalDateTime dueDate,
                             FormatSettingsDto formatSettings,
                             int detergentQty, int fabricQty, int plasticQty, int loads, String staffId) {
        this.invoiceNumber = invoiceNumber;
        this.customerName = customerName;
        this.contact = contact;
        this.service = service;
        this.consumables = consumables;
        this.subtotal = subtotal;
        this.tax = tax;
        this.discount = discount;
        this.total = total;
        this.paymentMethod = paymentMethod;
        this.amountGiven = amountGiven; // ✅ INITIALIZE
        this.change = change; // ✅ INITIALIZE
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.formatSettings = formatSettings;
        this.detergentQty = detergentQty;
        this.fabricQty = fabricQty;
        this.plasticQty = plasticQty;
        this.loads = loads;
        this.staffId = staffId;
    }

    // Getters and Setters
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    
    public ServiceEntryDto getService() { return service; }
    public void setService(ServiceEntryDto service) { this.service = service; }
    
    public List<ServiceEntryDto> getConsumables() { return consumables; }
    public void setConsumables(List<ServiceEntryDto> consumables) { this.consumables = consumables; }
    
    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    
    public Double getTax() { return tax; }
    public void setTax(Double tax) { this.tax = tax; }
    
    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }
    
    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    // ✅ ADD GETTERS AND SETTERS FOR amountGiven AND change
    public Double getAmountGiven() { return amountGiven; }
    public void setAmountGiven(Double amountGiven) { this.amountGiven = amountGiven; }
    
    public Double getChange() { return change; }
    public void setChange(Double change) { this.change = change; }
    
    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }
    
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    
    public FormatSettingsDto getFormatSettings() { return formatSettings; }
    public void setFormatSettings(FormatSettingsDto formatSettings) { this.formatSettings = formatSettings; }
    
    public int getDetergentQty() { return detergentQty; }
    public void setDetergentQty(int detergentQty) { this.detergentQty = detergentQty; }
    
    public int getFabricQty() { return fabricQty; }
    public void setFabricQty(int fabricQty) { this.fabricQty = fabricQty; }
    
    public int getPlasticQty() { return plasticQty; }
    public void setPlasticQty(int plasticQty) { this.plasticQty = plasticQty; }
    
    public int getLoads() { return loads; }
    public void setLoads(int loads) { this.loads = loads; }
}