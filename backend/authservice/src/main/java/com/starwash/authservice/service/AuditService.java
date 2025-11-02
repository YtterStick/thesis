package com.starwash.authservice.service;

import com.starwash.authservice.model.AuditLog;
import com.starwash.authservice.repository.AuditLogRepository;
import com.starwash.authservice.security.ManilaTimeUtil;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logActivity(String username, String action, String entityType, 
                          String entityId, String description, HttpServletRequest request) {
        logActivity(username, action, entityType, entityId, description, null, null, request);
    }

    public void logActivity(String username, String action, String entityType, 
                          String entityId, String description, Object oldValues, 
                          Object newValues, HttpServletRequest request) {
        
        String ipAddress = getClientIpAddress(request);
        
        LocalDateTime manilaTime = ManilaTimeUtil.now();
        
        AuditLog auditLog = new AuditLog(username, action, entityType, entityId, description, ipAddress);
        auditLog.setTimestamp(manilaTime);
        auditLog.setOldValues(oldValues);
        auditLog.setNewValues(newValues);
        
        auditLogRepository.save(auditLog);
        
        System.out.println("📝 Audit log created at Manila time: " + manilaTime);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    public List<AuditLog> getLogsByUser(String username) {
        return auditLogRepository.findByUsernameOrderByTimestampDesc(username);
    }

    public List<AuditLog> getLogsByAction(String action) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action);
    }

    public List<AuditLog> getLogsByDateRange(LocalDateTime start, LocalDateTime end) {
        return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(start, end);
    }

    public List<AuditLog> getLogsByEntity(String entityType, String entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }
}