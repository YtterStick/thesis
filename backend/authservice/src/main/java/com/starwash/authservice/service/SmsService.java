package com.starwash.authservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class SmsService {
    
    @Value("${sms.server.url}")
    private String smsServerUrl;
    
    @Autowired
    private RestTemplate restTemplate;
    
    public void sendLoadCompletedNotification(String phoneNumber, String customerName, String serviceType) {
        String message = String.format(
            "Hi %s! Your %s service has been COMPLETED and is ready for pickup. Thank you for choosing StarWash!",
            customerName, serviceType
        );
        
        System.out.println("🚀 SMS Notification Triggered!");
        System.out.println("📞 Phone: " + phoneNumber);
        System.out.println("👤 Customer: " + customerName);
        System.out.println("🛠️ Service: " + serviceType);
        System.out.println("🔗 SMS Server URL: " + smsServerUrl);
        
        sendSms(phoneNumber, message);
    }
    
    private void sendSms(String phoneNumber, String message) {
        Map<String, String> request = new HashMap<>();
        request.put("phone", phoneNumber);
        request.put("message", message);
        
        try {
            System.out.println("📤 Making POST request to: " + smsServerUrl);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                smsServerUrl, 
                request, 
                String.class
            );
            
            System.out.println("✅ SMS Server Response Status: " + response.getStatusCode());
            System.out.println("✅ SMS Server Response Body: " + response.getBody());
            
        } catch (Exception e) {
            System.err.println("❌ Failed to send SMS: " + e.getMessage());
            e.printStackTrace();
        }
    }
}