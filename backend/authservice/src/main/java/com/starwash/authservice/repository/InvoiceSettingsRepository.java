package com.starwash.authservice.repository;

import com.starwash.authservice.model.InvoiceSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceSettingsRepository extends MongoRepository<InvoiceSettings, String> {

    // 🔍 Get the most recent invoice settings (for preview or printing)
    Optional<InvoiceSettings> findTopByOrderByIdDesc();
}