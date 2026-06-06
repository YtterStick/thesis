package com.starwash.authservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableScheduling
@EnableMongoAuditing
public class AuthserviceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthserviceApplication.class, args);
        System.out.println("🚀 Authservice is running with MongoDB backing!");
        System.out.println("🔧 Active profile: " + System.getProperty("spring.profiles.active"));
        System.out.println("⏰ Automatic stock monitoring is ENABLED (checks every 30 minutes)");
    }
}