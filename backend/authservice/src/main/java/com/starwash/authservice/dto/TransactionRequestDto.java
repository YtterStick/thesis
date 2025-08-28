package com.starwash.authservice.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class TransactionRequestDto {

    private String customerName;
    private String contact;

    // ID of the selected service
    private String serviceId;

    // Number of loads (quantity multiplier for the service)
    private Integer loads;

    // Map of consumable item names to quantities (e.g. "Plastic" -> 2)
    private Map<String, Integer> consumableQuantities;

    // ✅ Payment method (e.g. "Cash", "GCash", "Card")
    private String paymentMethod;

    // ✅ Amount given by customer (used to compute change)
    private Double amountGiven;

    // ⏳ Optional override for issue/due dates
    private LocalDateTime issueDate;
    private LocalDateTime dueDate;

    // 🔒 Optional: trigger invoice generation (default true)
    private boolean generateInvoice = true;

    // 👤 Optional: staff ID for traceability
    private String staffId;

    // 📝 Optional: notes or override reason
    private String notes;

    public TransactionRequestDto() {}

    public TransactionRequestDto(String customerName, String contact,
                                 String serviceId, Integer loads,
                                 Map<String, Integer> consumableQuantities,
                                 String paymentMethod, Double amountGiven,
                                 LocalDateTime issueDate, LocalDateTime dueDate,
                                 boolean generateInvoice, String staffId, String notes) {
        this.customerName = customerName;
        this.contact = contact;
        this.serviceId = serviceId;
        this.loads = loads;
        this.consumableQuantities = consumableQuantities;
        this.paymentMethod = paymentMethod;
        this.amountGiven = amountGiven;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.generateInvoice = generateInvoice;
        this.staffId = staffId;
        this.notes = notes;
    }

    // Getters and Setters
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public String getServiceId() { return serviceId; }
    public void setServiceId(String serviceId) { this.serviceId = serviceId; }

    public Integer getLoads() { return loads; }
    public void setLoads(Integer loads) { this.loads = loads; }

    public Map<String, Integer> getConsumableQuantities() { return consumableQuantities; }
    public void setConsumableQuantities(Map<String, Integer> consumableQuantities) {
        this.consumableQuantities = consumableQuantities;
    }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Double getAmountGiven() { return amountGiven; }
    public void setAmountGiven(Double amountGiven) { this.amountGiven = amountGiven; }

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public boolean isGenerateInvoice() { return generateInvoice; }
    public void setGenerateInvoice(boolean generateInvoice) { this.generateInvoice = generateInvoice; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}