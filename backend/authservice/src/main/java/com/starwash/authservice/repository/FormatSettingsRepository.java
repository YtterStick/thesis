package com.starwash.authservice.repository;

import com.starwash.authservice.model.FormatSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FormatSettingsRepository extends MongoRepository<FormatSettings, String> {
    Optional<FormatSettings> findTopByOrderByIdDesc();
}