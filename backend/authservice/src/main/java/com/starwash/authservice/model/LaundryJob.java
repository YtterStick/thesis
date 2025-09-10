package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "laundry_jobs")
public class LaundryJob {

    @Id
    private String id;

    private String transactionId;
    private String customerName;
    private String contact;

    private List<LoadAssignment> loadAssignments = new ArrayList<>();

    private Integer detergentQty;
    private Integer fabricQty;

    private List<String> statusFlow = new ArrayList<>();
    private Integer currentStep = 0;

    // ✅ Claiming fields
    private String pickupStatus = "UNCLAIMED"; // UNCLAIMED | CLAIMED
    private LocalDateTime claimDate;
    private String claimReceiptNumber;
    private String claimedByStaffId;

    private String serviceType;

    public LaundryJob() {
    }

    public LaundryJob(String transactionId, String customerName, String contact,
                      List<LoadAssignment> loadAssignments,
                      Integer detergentQty, Integer fabricQty,
                      List<String> statusFlow, Integer currentStep) {
        this.transactionId = transactionId;
        this.customerName = customerName;
        this.contact = contact;
        this.loadAssignments = loadAssignments != null ? loadAssignments : new ArrayList<>();
        this.detergentQty = detergentQty;
        this.fabricQty = fabricQty;
        this.statusFlow = statusFlow != null ? statusFlow : new ArrayList<>();
        this.currentStep = currentStep != null ? currentStep : 0;
    }

    // ✅ Claiming getters/setters
    public LocalDateTime getClaimDate() {
        return claimDate;
    }

    public void setClaimDate(LocalDateTime claimDate) {
        this.claimDate = claimDate;
    }

    public String getClaimReceiptNumber() {
        return claimReceiptNumber;
    }

    public void setClaimReceiptNumber(String claimReceiptNumber) {
        this.claimReceiptNumber = claimReceiptNumber;
    }

    public String getClaimedByStaffId() {
        return claimedByStaffId;
    }

    public void setClaimedByStaffId(String claimedByStaffId) {
        this.claimedByStaffId = claimedByStaffId;
    }

    // ✅ Core getters/setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public List<LoadAssignment> getLoadAssignments() {
        return loadAssignments;
    }

    public void setLoadAssignments(List<LoadAssignment> loadAssignments) {
        this.loadAssignments = loadAssignments;
    }

    public Integer getDetergentQty() {
        return detergentQty;
    }

    public void setDetergentQty(Integer detergentQty) {
        this.detergentQty = detergentQty;
    }

    public Integer getFabricQty() {
        return fabricQty;
    }

    public void setFabricQty(Integer fabricQty) {
        this.fabricQty = fabricQty;
    }

    public List<String> getStatusFlow() {
        return statusFlow;
    }

    public void setStatusFlow(List<String> statusFlow) {
        this.statusFlow = statusFlow;
    }

    public Integer getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(Integer currentStep) {
        this.currentStep = currentStep;
    }

    public String getPickupStatus() {
        return pickupStatus;
    }

    public void setPickupStatus(String pickupStatus) {
        this.pickupStatus = pickupStatus;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    @Override
    public String toString() {
        return "LaundryJob{" +
                "id='" + id + '\'' +
                ", transactionId='" + transactionId + '\'' +
                ", customerName='" + customerName + '\'' +
                ", contact='" + contact + '\'' +
                ", loads=" + (loadAssignments != null ? loadAssignments.size() : 0) +
                ", detergentQty=" + detergentQty +
                ", fabricQty=" + fabricQty +
                ", currentStep=" + currentStep +
                ", pickupStatus=" + pickupStatus +
                ", serviceType='" + serviceType + '\'' +
                '}';
    }

    // ✅ Inner class for per-load tracking
    public static class LoadAssignment {
        private int loadNumber;
        private String machineId;
        private String status; // NOT_STARTED, WASHING, DRYING, COMPLETED
        private Integer durationMinutes;
        private LocalDateTime startTime;
        private LocalDateTime endTime;

        public LoadAssignment() {
        }

        public LoadAssignment(int loadNumber, String machineId, String status,
                              Integer durationMinutes, LocalDateTime startTime, LocalDateTime endTime) {
            this.loadNumber = loadNumber;
            this.machineId = machineId;
            this.status = status;
            this.durationMinutes = durationMinutes;
            this.startTime = startTime;
            this.endTime = endTime;
        }

        public int getLoadNumber() {
            return loadNumber;
        }

        public void setLoadNumber(int loadNumber) {
            this.loadNumber = loadNumber;
        }

        public String getMachineId() {
            return machineId;
        }

        public void setMachineId(String machineId) {
            this.machineId = machineId;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Integer getDurationMinutes() {
            return durationMinutes;
        }

        public void setDurationMinutes(Integer durationMinutes) {
            this.durationMinutes = durationMinutes;
        }

        public LocalDateTime getStartTime() {
            return startTime;
        }

        public void setStartTime(LocalDateTime startTime) {
            this.startTime = startTime;
        }

        public LocalDateTime getEndTime() {
            return endTime;
        }

        public void setEndTime(LocalDateTime endTime) {
            this.endTime = endTime;
        }
    }
}
