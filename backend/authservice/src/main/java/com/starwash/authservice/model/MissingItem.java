package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "missing_items")
public class MissingItem {

    @Id
    private String id;
    
    private String itemDescription;
    private String machineId;
    private String notes;
    private LocalDateTime foundDate;
    private String foundByStaffId;
    private boolean isClaimed;
    private String claimedByName;
    private LocalDateTime claimDate;

    public MissingItem() {
        this.foundDate = LocalDateTime.now();
        this.isClaimed = false;
    }

    public MissingItem(String itemDescription, String machineId, String notes, String foundByStaffId) {
        this();
        this.itemDescription = itemDescription;
        this.machineId = machineId;
        this.notes = notes;
        this.foundByStaffId = foundByStaffId;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }

    public String getMachineId() { return machineId; }
    public void setMachineId(String machineId) { this.machineId = machineId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getFoundDate() { return foundDate; }
    public void setFoundDate(LocalDateTime foundDate) { this.foundDate = foundDate; }

    public String getFoundByStaffId() { return foundByStaffId; }
    public void setFoundByStaffId(String foundByStaffId) { this.foundByStaffId = foundByStaffId; }

    public boolean isClaimed() { return isClaimed; }
    public void setClaimed(boolean claimed) { isClaimed = claimed; }

    public String getClaimedByName() { return claimedByName; }
    public void setClaimedByName(String claimedByName) { this.claimedByName = claimedByName; }

    public LocalDateTime getClaimDate() { return claimDate; }
    public void setClaimDate(LocalDateTime claimDate) { this.claimDate = claimDate; }
}