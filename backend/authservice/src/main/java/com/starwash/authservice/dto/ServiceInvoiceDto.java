package com.starwash.authservice.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ServiceInvoiceDto {

    private String invoiceNumber;

    private String customerName;
    private String contact;

    private ServiceEntryDto service;
    private List<ServiceEntryDto> consumables;

    private Double subtotal;
    private Double tax;
    private Double discount;
    private Double total;

    private String paymentMethod;

    private LocalDateTime issueDate;
    private LocalDateTime dueDate;

    private FormatSettingsDto formatSettings;

    // 🆕 Added fields for Option 1
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
                             LocalDateTime issueDate, LocalDateTime dueDate,
                             FormatSettingsDto formatSettings) {
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
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.formatSettings = formatSettings;
    }

    // Getters
    public String getInvoiceNumber() { return invoiceNumber; }
    public String getCustomerName() { return customerName; }
    public String getContact() { return contact; }
    public ServiceEntryDto getService() { return service; }
    public List<ServiceEntryDto> getConsumables() { return consumables; }
    public Double getSubtotal() { return subtotal; }
    public Double getTax() { return tax; }
    public Double getDiscount() { return discount; }
    public Double getTotal() { return total; }
    public String getPaymentMethod() { return paymentMethod; }
    public LocalDateTime getIssueDate() { return issueDate; }
    public LocalDateTime getDueDate() { return dueDate; }
    public FormatSettingsDto getFormatSettings() { return formatSettings; }
    public int getDetergentQty() { return detergentQty; }
    public int getFabricQty() { return fabricQty; }
    public int getPlasticQty() { return plasticQty; }
    public int getLoads() { return loads; }

    // Setters
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public void setContact(String contact) { this.contact = contact; }
    public void setService(ServiceEntryDto service) { this.service = service; }
    public void setConsumables(List<ServiceEntryDto> consumables) { this.consumables = consumables; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    public void setTax(Double tax) { this.tax = tax; }
    public void setDiscount(Double discount) { this.discount = discount; }
    public void setTotal(Double total) { this.total = total; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    public void setFormatSettings(FormatSettingsDto formatSettings) { this.formatSettings = formatSettings; }
    public void setDetergentQty(int detergentQty) { this.detergentQty = detergentQty; }
    public void setFabricQty(int fabricQty) { this.fabricQty = fabricQty; }
    public void setPlasticQty(int plasticQty) { this.plasticQty = plasticQty; }
    public void setLoads(int loads) { this.loads = loads; }
}