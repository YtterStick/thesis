package com.starwash.authservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class SmsService {
    
    private static final String SMS_SERVER_URL = "http://192.168.3.100:5001/send-sms";
    
    @Autowired
    private RestTemplate restTemplate;
    
    public void sendLoadCompletedNotification(String phoneNumber, String customerName, String serviceType) {
        String message = String.format(
            "Hi %s! Your %s service has been COMPLETED and is ready for pickup. Thank you for choosing StarWash!",
            customerName, serviceType
        );
        
        sendSms(phoneNumber, message);
    }
    
    private void sendSms(String phoneNumber, String message) {
        Map<String, String> request = new HashMap<>();
        request.put("phone", phoneNumber);
        request.put("message", message);
        
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                SMS_SERVER_URL, 
                request, 
                Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ SMS sent to " + phoneNumber);
            } else {
                System.out.println("❌ SMS failed: " + response.getBody());
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to send SMS: " + e.getMessage());
        }
    }
}