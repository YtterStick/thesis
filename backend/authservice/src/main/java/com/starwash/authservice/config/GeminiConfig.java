package com.starwash.authservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class GeminiConfig {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Bean
    public RestTemplate geminiRestTemplate() {
        return new RestTemplate();
    }

    public String getGeminiApiKey() {
        return geminiApiKey;
    }
}
