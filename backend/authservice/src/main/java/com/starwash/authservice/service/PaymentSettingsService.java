// PaymentSettingsService.java
package com.starwash.authservice.service;

import com.starwash.authservice.model.PaymentSettings;
import com.starwash.authservice.repository.PaymentSettingsRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PaymentSettingsService {
    private final PaymentSettingsRepository paymentSettingsRepository;

    public PaymentSettingsService(PaymentSettingsRepository paymentSettingsRepository) {
        this.paymentSettingsRepository = paymentSettingsRepository;
    }

    public PaymentSettings getPaymentSettings() {
        Optional<PaymentSettings> settings = paymentSettingsRepository.findById("default");
        return settings.orElseGet(() -> {
            PaymentSettings defaultSettings = new PaymentSettings("default", true);
            return paymentSettingsRepository.save(defaultSettings);
        });
    }

    public PaymentSettings updatePaymentSettings(boolean gcashEnabled) {
        PaymentSettings settings = new PaymentSettings("default", gcashEnabled);
        return paymentSettingsRepository.save(settings);
    }
}