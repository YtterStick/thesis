package com.starwash.authservice.dto;

import com.starwash.authservice.model.FormatSettings;

public class FormatSettingsDto {

    private String storeName;
    private String address;
    private String phone;
    private String footerNote;
    private String trackingUrl;

    public FormatSettingsDto() {}

    public FormatSettingsDto(String storeName, String address, String phone,
                             String footerNote, String trackingUrl) {
        this.storeName = storeName;
        this.address = address;
        this.phone = phone;
        this.footerNote = footerNote;
        this.trackingUrl = trackingUrl;
    }

    public FormatSettingsDto(FormatSettings model) {
        this.storeName = model.getStoreName();
        this.address = model.getAddress();
        this.phone = model.getPhone();
        this.footerNote = model.getFooterNote();
        this.trackingUrl = model.getTrackingUrl();
    }

    // Getters
    public String getStoreName() { return storeName; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getFooterNote() { return footerNote; }
    public String getTrackingUrl() { return trackingUrl; }

    // Setters
    public void setStoreName(String storeName) { this.storeName = storeName; }
    public void setAddress(String address) { this.address = address; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setFooterNote(String footerNote) { this.footerNote = footerNote; }
    public void setTrackingUrl(String trackingUrl) { this.trackingUrl = trackingUrl; }
}