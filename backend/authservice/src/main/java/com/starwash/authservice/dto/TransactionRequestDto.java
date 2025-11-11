package com.starwash.authservice.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class TransactionRequestDto {

    private String id;

    private String customerName;
    private String contact;
    private String serviceId;
    private Integer loads;

    private Map<String, Integer> consumableQuantities;
    private String paymentMethod;
    private Double amountGiven;

    private LocalDateTime issueDate;
    private LocalDateTime dueDate;

    private boolean generateInvoice = true;
    private String staffId;
    private String notes;

    private Integer detergentQty;
    private Integer fabricQty;
    private List<String> statusFlow;
    private String gcashReference;

    // NEW FIELDS FOR AUTO-CALCULATION
    private Double totalWeightKg; // Total weight of laundry in kg
    private Boolean autoCalculateLoads = true; // Flag to auto-calculate loads

    public TransactionRequestDto() {}

    public TransactionRequestDto(String customerName, String contact,
                                 String serviceId, Integer loads,
                                 Map<String, Integer> consumableQuantities,
                                 String paymentMethod, Double amountGiven,
                                 LocalDateTime issueDate, LocalDateTime dueDate,
                                 boolean generateInvoice, String staffId, String notes,
                                 Integer detergentQty, Integer fabricQty, List<String> statusFlow,
                                 String gcashReference, Double totalWeightKg, Boolean autoCalculateLoads) {
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
        this.detergentQty = detergentQty;
        this.fabricQty = fabricQty;
        this.statusFlow = statusFlow;
        this.gcashReference = gcashReference;
        this.totalWeightKg = totalWeightKg;
        this.autoCalculateLoads = autoCalculateLoads;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public Integer getDetergentQty() { return detergentQty; }
    public void setDetergentQty(Integer detergentQty) { this.detergentQty = detergentQty; }

    public Integer getFabricQty() { return fabricQty; }
    public void setFabricQty(Integer fabricQty) { this.fabricQty = fabricQty; }

    public List<String> getStatusFlow() { return statusFlow; }
    public void setStatusFlow(List<String> statusFlow) { this.statusFlow = statusFlow; }

    public String getGcashReference() { return gcashReference; }
    public void setGcashReference(String gcashReference) { this.gcashReference = gcashReference; }

    // NEW GETTERS AND SETTERS
    public Double getTotalWeightKg() { return totalWeightKg; }
    public void setTotalWeightKg(Double totalWeightKg) { this.totalWeightKg = totalWeightKg; }
    
    public Boolean getAutoCalculateLoads() { return autoCalculateLoads; }
    public void setAutoCalculateLoads(Boolean autoCalculateLoads) { this.autoCalculateLoads = autoCalculateLoads; }
}