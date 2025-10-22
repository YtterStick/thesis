package com.starwash.authservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class SmsService {
    
    @Value("${sms.server.url}")
    private String smsServerUrl;
    
    public void sendLoadCompletedNotification(String phoneNumber, String customerName, String serviceType) {
        // Add phone number validation
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            System.err.println("❌ SMS FAILED: Phone number is null or empty!");
            return;
        }
        
        // Clean phone number
        String cleanPhone = phoneNumber.trim();
        if (cleanPhone.startsWith("0") && cleanPhone.length() >= 10) {
            cleanPhone = "+63" + cleanPhone.substring(1);
        }
        
        String message = String.format(
            "Hi %s! Your %s service has been COMPLETED and is ready for pickup. Thank you for choosing StarWash!",
            customerName, serviceType
        );
        
        System.out.println("🚀 SMS Notification Triggered!");
        System.out.println("📞 Phone: " + cleanPhone);
        System.out.println("👤 Customer: " + customerName);
        System.out.println("🛠️ Service: " + serviceType);
        System.out.println("🔗 SMS Server URL: " + smsServerUrl);
        
        sendSmsDirect(cleanPhone, message);
    }
    
    private void sendSmsDirect(String phoneNumber, String message) {
        try {
            // Create JSON payload
            String jsonPayload = String.format(
                "{\"phone\": \"%s\", \"message\": \"%s\"}",
                phoneNumber, message
            );
            
            System.out.println("📤 Sending direct HTTP request to: " + smsServerUrl);
            System.out.println("📤 Payload: " + jsonPayload);
            
            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
                
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(smsServerUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(10))
                .build();
            
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            
            System.out.println("✅ SMS Server Response Status: " + response.statusCode());
            System.out.println("✅ SMS Server Response Body: " + response.body());
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send SMS: " + e.getMessage());
            e.printStackTrace();
        }
    }
}