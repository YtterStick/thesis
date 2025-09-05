package com.starwash.authservice.dto;

import com.starwash.authservice.model.LaundryJob.LoadAssignment;

import java.time.LocalDateTime;
import java.util.List;

public class LaundryJobDto {

    private String transactionId;
    private String customerName;
    private String contact; // ✅ New field for customer contact
    private List<LoadAssignment> loadAssignments;
    private Integer detergentQty;
    private Integer fabricQty;
    private List<String> statusFlow;
    private Integer currentStep;
    private LocalDateTime issueDate;
    private String serviceType;

    // ✅ Total loads for convenience
    private Integer totalLoads;

    public LaundryJobDto() {}

    public LaundryJobDto(
            String transactionId,
            String customerName,
            String contact, // ✅ Add in constructor
            List<LoadAssignment> loadAssignments,
            Integer detergentQty,
            Integer fabricQty,
            List<String> statusFlow,
            Integer currentStep,
            LocalDateTime issueDate,
            String serviceType
    ) {
        this.transactionId = transactionId;
        this.customerName = customerName;
        this.contact = contact;
        this.loadAssignments = loadAssignments;
        this.detergentQty = detergentQty;
        this.fabricQty = fabricQty;
        this.statusFlow = statusFlow;
        this.currentStep = currentStep;
        this.issueDate = issueDate;
        this.serviceType = serviceType;
        this.totalLoads = loadAssignments != null ? loadAssignments.size() : 0;
    }

    // 🔹 Getters and setters
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getContact() { return contact; } // ✅ Getter
    public void setContact(String contact) { this.contact = contact; } // ✅ Setter

    public List<LoadAssignment> getLoadAssignments() { return loadAssignments; }
    public void setLoadAssignments(List<LoadAssignment> loadAssignments) { 
        this.loadAssignments = loadAssignments; 
        this.totalLoads = loadAssignments != null ? loadAssignments.size() : 0;
    }

    public Integer getDetergentQty() { return detergentQty; }
    public void setDetergentQty(Integer detergentQty) { this.detergentQty = detergentQty; }

    public Integer getFabricQty() { return fabricQty; }
    public void setFabricQty(Integer fabricQty) { this.fabricQty = fabricQty; }

    public List<String> getStatusFlow() { return statusFlow; }
    public void setStatusFlow(List<String> statusFlow) { this.statusFlow = statusFlow; }

    public Integer getCurrentStep() { return currentStep; }
    public void setCurrentStep(Integer currentStep) { this.currentStep = currentStep; }

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }

    public Integer getTotalLoads() { return totalLoads; }
    public void setTotalLoads(Integer totalLoads) { this.totalLoads = totalLoads; }
}
