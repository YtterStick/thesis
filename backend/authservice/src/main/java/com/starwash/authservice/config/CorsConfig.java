package com.starwash.authservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.client.RestTemplate;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        System.out.println("✅ CORS Configuration loaded - Allowing cross-origin requests");
        
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(
                            "https://starwashph.com",
                            "https://www.starwashph.com", 
                            "http://localhost:3000",
                            "http://127.0.0.1:3000",
                            "http://localhost:5173",      // Vite dev server
                            "http://127.0.0.1:5173",      // Vite dev server
                            "https://thesis-g0pr.onrender.com"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD")
                        .allowedHeaders("*")
                        .exposedHeaders(
                            "Authorization", 
                            "Content-Type", 
                            "Access-Control-Allow-Origin",
                            "Access-Control-Allow-Credentials"
                        )
                        .allowCredentials(true)
                        .maxAge(3600); // 1 hour cache for preflight requests
            }
        };
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}