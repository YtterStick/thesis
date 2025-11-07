package com.starwash.authservice.controller;

import com.starwash.authservice.service.SmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class SmsController {

    @Autowired
    private SmsService smsService;

    @PostMapping("/send-completion-sms")
    public ResponseEntity<Map<String, String>> sendCompletionSms(
            @RequestBody SmsRequest request) {
        try {
            smsService.sendLoadCompletedNotification(
                request.getPhoneNumber(),
                request.getCustomerName(),
                request.getServiceType(),
                request.getTransactionId() // Added transaction ID parameter
            );
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "SMS sent successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to send SMS: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public static class SmsRequest {
        private String transactionId;
        private String customerName;
        private String phoneNumber;
        private String serviceType;

        // Getters and setters
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        
        public String getServiceType() { return serviceType; }
        public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    }
}