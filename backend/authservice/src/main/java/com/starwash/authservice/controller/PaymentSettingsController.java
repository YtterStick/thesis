// PaymentSettingsController.java
package com.starwash.authservice.controller;

import com.starwash.authservice.model.PaymentSettings;
import com.starwash.authservice.service.PaymentSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payment-settings")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentSettingsController {
    private final PaymentSettingsService paymentSettingsService;

    public PaymentSettingsController(PaymentSettingsService paymentSettingsService) {
        this.paymentSettingsService = paymentSettingsService;
    }

    @GetMapping
    public ResponseEntity<PaymentSettings> getPaymentSettings() {
        return ResponseEntity.ok(paymentSettingsService.getPaymentSettings());
    }

    @PutMapping
    public ResponseEntity<PaymentSettings> updatePaymentSettings(@RequestBody PaymentSettings settings) {
        return ResponseEntity.ok(paymentSettingsService.updatePaymentSettings(settings.isGcashEnabled()));
    }
}