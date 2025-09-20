package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "payment_settings")
public class PaymentSettings {
    @Id
    private String id;
    private boolean gcashEnabled = true;

    public PaymentSettings() {}

    public PaymentSettings(String id, boolean gcashEnabled) {
        this.id = id;
        this.gcashEnabled = gcashEnabled;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public boolean isGcashEnabled() { return gcashEnabled; }
    public void setGcashEnabled(boolean gcashEnabled) { this.gcashEnabled = gcashEnabled; }
}