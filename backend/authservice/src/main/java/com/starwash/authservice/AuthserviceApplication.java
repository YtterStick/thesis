package com.starwash.authservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableMongoRepositories(basePackages = "com.starwash.authservice.repository")
@EnableScheduling
public class AuthserviceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthserviceApplication.class, args);
        System.out.println("🚀 Authservice is running with MongoDB backing!");
        System.out.println("🔧 Active profile: " + System.getProperty("spring.profiles.active"));
    }
}