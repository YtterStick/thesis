package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "invoice_settings")
public class InvoiceSettings {

    @Id
    private String id;

    private String storeName;
    private String address;
    private String phone;
    private String footerNote;
    private String trackingUrl;

    public InvoiceSettings() {}

    public InvoiceSettings(String storeName, String address, String phone,
                           String footerNote, String trackingUrl) {
        this.storeName = storeName;
        this.address = address;
        this.phone = phone;
        this.footerNote = footerNote;
        this.trackingUrl = trackingUrl;
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getStoreName() {
        return storeName;
    }

    public String getAddress() {
        return address;
    }

    public String getPhone() {
        return phone;
    }

    public String getFooterNote() {
        return footerNote;
    }

    public String getTrackingUrl() {
        return trackingUrl;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setFooterNote(String footerNote) {
        this.footerNote = footerNote;
    }

    public void setTrackingUrl(String trackingUrl) {
        this.trackingUrl = trackingUrl;
    }
}