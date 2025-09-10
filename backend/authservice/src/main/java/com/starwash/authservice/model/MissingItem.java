package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "missing_items")
public class MissingItem {
    @Id
    private String id;
    private String itemDescription;
    private String foundInMachineId;
    private LocalDateTime foundDate;
    private String foundByStaffId;
    private String claimedBy;
    private LocalDateTime claimedDate;
    private boolean isClaimed;
    private String notes;

    // Constructors
    public MissingItem() {}

    public MissingItem(String itemDescription, String foundInMachineId, String foundByStaffId) {
        this.itemDescription = itemDescription;
        this.foundInMachineId = foundInMachineId;
        this.foundByStaffId = foundByStaffId;
        this.foundDate = LocalDateTime.now();
        this.isClaimed = false;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }
    
    public String getFoundInMachineId() { return foundInMachineId; }
    public void setFoundInMachineId(String foundInMachineId) { this.foundInMachineId = foundInMachineId; }
    
    public LocalDateTime getFoundDate() { return foundDate; }
    public void setFoundDate(LocalDateTime foundDate) { this.foundDate = foundDate; }
    
    public String getFoundByStaffId() { return foundByStaffId; }
    public void setFoundByStaffId(String foundByStaffId) { this.foundByStaffId = foundByStaffId; }
    
    public String getClaimedBy() { return claimedBy; }
    public void setClaimedBy(String claimedBy) { this.claimedBy = claimedBy; }
    
    public LocalDateTime getClaimedDate() { return claimedDate; }
    public void setClaimedDate(LocalDateTime claimedDate) { this.claimedDate = claimedDate; }
    
    public boolean isClaimed() { return isClaimed; }
    public void setClaimed(boolean claimed) { isClaimed = claimed; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}