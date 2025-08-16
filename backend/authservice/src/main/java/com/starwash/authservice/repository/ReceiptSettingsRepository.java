package com.starwash.authservice.repository;

import com.starwash.authservice.model.ReceiptSettings;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ReceiptSettingsRepository extends MongoRepository<ReceiptSettings, String> {
    Optional<ReceiptSettings> findTopByOrderByIdDesc();
}