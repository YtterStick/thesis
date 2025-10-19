package com.starwash.authservice.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.Date;

@Configuration
@EnableMongoAuditing
@EnableMongoRepositories(basePackages = "com.starwash.authservice.repository")
public class MongoConfig {

    // Manila timezone constant
    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");

    @Bean
    public MongoClient mongoClient() {
        // Use environment variable for MongoDB URI
        String mongoUri = System.getenv("MONGODB_URI");
        if (mongoUri == null || mongoUri.isEmpty()) {
            // Fallback to your connection string
            mongoUri = "mongodb+srv://ytterstick:vQjnfLWfTnN43tyf@starwash-cluster.fp7frav.mongodb.net";
        }
        
        System.out.println("🔗 Connecting to MongoDB with Manila timezone: " + MANILA_ZONE);
        return MongoClients.create(mongoUri);
    }
    
    @Bean
    public MongoTemplate mongoTemplate() {
        MongoTemplate template = new MongoTemplate(mongoClient(), "starwashDB");
        System.out.println("✅ MongoDB configured with Manila timezone: " + MANILA_ZONE);
        return template;
    }

    /**
     * Custom conversions to handle Java 8 Date/Time API with MongoDB
     * This ensures all dates are stored and retrieved in Manila timezone
     */
    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        System.out.println("🕐 MongoDB custom conversions configured for Manila timezone");
        
        return new MongoCustomConversions(Arrays.asList(
            new LocalDateTimeToDateConverter(),
            new DateToLocalDateTimeConverter()
        ));
    }

    // =============================================
    // CONVERTER IMPLEMENTATIONS
    // =============================================

    /**
     * Convert LocalDateTime to Date for MongoDB storage
     * Assumes LocalDateTime is in Manila timezone
     */
    public static class LocalDateTimeToDateConverter implements Converter<LocalDateTime, Date> {
        @Override
        public Date convert(@NonNull LocalDateTime source) {
            ZonedDateTime zonedDateTime = source.atZone(MANILA_ZONE);
            return Date.from(zonedDateTime.toInstant());
        }
    }

    /**
     * Convert Date from MongoDB to LocalDateTime in Manila timezone
     */
    public static class DateToLocalDateTimeConverter implements Converter<Date, LocalDateTime> {
        @Override
        public LocalDateTime convert(@NonNull Date source) {
            ZonedDateTime zonedDateTime = source.toInstant().atZone(MANILA_ZONE);
            return zonedDateTime.toLocalDateTime();
        }
    }

    /**
     * Utility method to get current time in Manila timezone
     */
    public static LocalDateTime getCurrentManilaTime() {
        return LocalDateTime.now(MANILA_ZONE);
    }

    /**
     * Utility method to get current zoned date time in Manila timezone
     */
    public static ZonedDateTime getCurrentManilaZonedDateTime() {
        return ZonedDateTime.now(MANILA_ZONE);
    }

    /**
     * Get Manila timezone ID
     */
    public static ZoneId getManilaZone() {
        return MANILA_ZONE;
    }
}