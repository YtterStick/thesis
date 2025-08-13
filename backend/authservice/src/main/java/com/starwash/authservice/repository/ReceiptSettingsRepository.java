package com.starwash.authservice.repository;

import com.starwash.authservice.model.ReceiptSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReceiptSettingsRepository extends MongoRepository<ReceiptSettings, String> {

    /**
     * Fetches the most recently saved receipt settings.
     * Used for dynamic preview and print rendering.
     *
     * @return Optional containing the latest ReceiptSettings, if any
     */
    Optional<ReceiptSettings> findTopByOrderByIdDesc();

    // Future extension:
    // Optional<ReceiptSettings> findTopByUserIdOrderByIdDesc(String userId);
}