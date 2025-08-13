package com.starwash.authservice.model;

import com.starwash.authservice.dto.ReceiptSettingsDto;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "receipt_settings")
public class ReceiptSettings {

    @Id
    private String id;

    private String storeName;
    private String address;
    private String phone;
    private String footerNote;
    private String trackingUrl;

    public ReceiptSettings() {}

    public ReceiptSettings(String storeName, String address, String phone,
                           String footerNote, String trackingUrl) {
        this.storeName = storeName;
        this.address = address;
        this.phone = phone;
        this.footerNote = footerNote;
        this.trackingUrl = trackingUrl;
    }

    public ReceiptSettings(String id, String storeName, String address, String phone,
                           String footerNote, String trackingUrl) {
        this(storeName, address, phone, footerNote, trackingUrl);
        this.id = id;
    }

    // 🧱 Convenience constructor from DTO
    public ReceiptSettings(ReceiptSettingsDto dto) {
        this.storeName = dto.getStoreName();
        this.address = dto.getAddress();
        this.phone = dto.getPhone();
        this.footerNote = dto.getFooterNote();
        this.trackingUrl = dto.getTrackingUrl();
    }

    // Getters
    public String getId() { return id; }
    public String getStoreName() { return storeName; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getFooterNote() { return footerNote; }
    public String getTrackingUrl() { return trackingUrl; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setStoreName(String storeName) { this.storeName = storeName; }
    public void setAddress(String address) { this.address = address; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setFooterNote(String footerNote) { this.footerNote = footerNote; }
    public void setTrackingUrl(String trackingUrl) { this.trackingUrl = trackingUrl; }
}