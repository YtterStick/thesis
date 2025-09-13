// PaymentSettingsRepository.java
package com.starwash.authservice.repository;

import com.starwash.authservice.model.PaymentSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentSettingsRepository extends MongoRepository<PaymentSettings, String> {
}