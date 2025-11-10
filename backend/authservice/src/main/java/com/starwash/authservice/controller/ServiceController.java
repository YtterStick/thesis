package com.starwash.authservice.controller;

import com.starwash.authservice.dto.ServiceItemDto;
import com.starwash.authservice.model.ServiceItem;
import com.starwash.authservice.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/services")
public class ServiceController {

    @Autowired
    private ServiceRepository serviceRepository;

    // Permanent service names that cannot be modified or deleted
    private static final String[] PERMANENT_SERVICES = {"Wash & Dry", "Wash", "Dry"};

    // GET all services
    @GetMapping
    public ResponseEntity<List<ServiceItemDto>> getAllServices() {
        try {
            List<ServiceItemDto> dtos = serviceRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // POST create new service
    @PostMapping
    public ResponseEntity<?> createService(@RequestBody ServiceItemDto dto) {
        try {
            String serviceName = dto.getName().trim();
            
            // Validate service name is not empty
            if (serviceName.isEmpty()) {
                return ResponseEntity.badRequest().body("Service name is required");
            }
            
            // Validate service name doesn't conflict with permanent services
            ResponseEntity<?> validationResponse = validateServiceName(serviceName, null);
            if (validationResponse != null) {
                return validationResponse;
            }
            
            // Check for duplicates
            if (serviceRepository.findByNameIgnoreCase(serviceName).isPresent()) {
                return ResponseEntity.badRequest().body("Service with this name already exists");
            }

            // Validate price
            if (dto.getPrice() == null || dto.getPrice() <= 0) {
                return ResponseEntity.badRequest().body("Valid price is required");
            }

            ServiceItem item = toEntity(dto);
            item.setId(null); // Ensure new ID is generated
            ServiceItem saved = serviceRepository.save(item);
            return ResponseEntity.ok(toDto(saved));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to create service: " + e.getMessage());
        }
    }

    // PUT update existing service
    @PutMapping("/{id}")
    public ResponseEntity<?> updateService(@PathVariable String id, @RequestBody ServiceItemDto dto) {
        try {
            Optional<ServiceItem> existingOpt = serviceRepository.findById(id);
            if (!existingOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ServiceItem existing = existingOpt.get();
            String newName = dto.getName().trim();
            String oldName = existing.getName();

            // Check if trying to modify permanent service name
            if (isPermanentService(oldName) && !oldName.equals(newName)) {
                return ResponseEntity.badRequest().body("Cannot modify the name of permanent service: " + oldName);
            }

            // Validate service name for non-permanent services
            if (!isPermanentService(oldName)) {
                ResponseEntity<?> validationResponse = validateServiceName(newName, oldName);
                if (validationResponse != null) {
                    return validationResponse;
                }
            }

            // Check for duplicates (excluding current service) for non-permanent services
            if (!isPermanentService(oldName)) {
                Optional<ServiceItem> duplicate = serviceRepository.findByNameIgnoreCase(newName);
                if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
                    return ResponseEntity.badRequest().body("Service with this name already exists");
                }
            }

            // Validate price
            if (dto.getPrice() == null || dto.getPrice() <= 0) {
                return ResponseEntity.badRequest().body("Valid price is required");
            }

            // For permanent services, only allow description and price updates
            if (isPermanentService(oldName)) {
                existing.setDescription(dto.getDescription());
                existing.setPrice(dto.getPrice());
                // Name remains unchanged for permanent services
            } else {
                // For custom services, allow all fields to be updated
                existing.setName(newName);
                existing.setDescription(dto.getDescription());
                existing.setPrice(dto.getPrice());
            }
            
            ServiceItem updated = serviceRepository.save(existing);
            return ResponseEntity.ok(toDto(updated));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to update service: " + e.getMessage());
        }
    }

    // DELETE service by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteService(@PathVariable String id) {
        try {
            Optional<ServiceItem> serviceOpt = serviceRepository.findById(id);
            if (!serviceOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ServiceItem service = serviceOpt.get();
            
            // Prevent deletion of permanent services (Wash, Dry, Wash & Dry)
            if (isPermanentService(service.getName())) {
                return ResponseEntity.badRequest().body("Cannot delete the permanent service: " + service.getName());
            }

            serviceRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to delete service: " + e.getMessage());
        }
    }

    // GET service by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getServiceById(@PathVariable String id) {
        try {
            Optional<ServiceItem> serviceOpt = serviceRepository.findById(id);
            if (!serviceOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(toDto(serviceOpt.get()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Helper method to check if service is permanent
    private boolean isPermanentService(String serviceName) {
        if (serviceName == null) return false;
        
        for (String permanentService : PERMANENT_SERVICES) {
            if (permanentService.equalsIgnoreCase(serviceName.trim())) {
                return true;
            }
        }
        return false;
    }

    // Helper method to validate service names
    private ResponseEntity<?> validateServiceName(String serviceName, String oldName) {
        if (serviceName == null || serviceName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Service name is required");
        }
        
        String normalized = serviceName.toLowerCase().trim();
        
        // Prevent exact matches of permanent service names
        for (String permanentService : PERMANENT_SERVICES) {
            String permanentNormalized = permanentService.toLowerCase();
            
            // Exact match check
            if (normalized.equals(permanentNormalized)) {
                // Allow if it's the same service being updated
                if (oldName != null && oldName.equalsIgnoreCase(serviceName)) {
                    return null;
                }
                return ResponseEntity.badRequest().body("Service name '" + serviceName + "' is reserved and cannot be used");
            }
        }
        
        // Additional checks for variations containing wash/dry
        if (containsPermanentServiceVariations(normalized)) {
            return ResponseEntity.badRequest().body("Service name cannot contain variations of 'Wash', 'Dry', or 'Wash & Dry'");
        }
        
        return null;
    }

    // Helper method to check for variations of permanent service names
    private boolean containsPermanentServiceVariations(String normalizedName) {
        // Check for variations like "wash", "dry", "wash & dry", "wash and dry"
        if (normalizedName.matches(".*\\bwash\\s*&?\\s*dry\\b.*") ||
            normalizedName.matches(".*\\bwash\\s*and\\s*dry\\b.*") ||
            normalizedName.matches("^wash\\s*\\d.*") ||
            normalizedName.matches("^dry\\s*\\d.*") ||
            normalizedName.matches("^wash\\s*&?\\s*dry\\s*\\d.*") ||
            normalizedName.matches(".*\\bwash\\s*only\\b.*") ||
            normalizedName.matches(".*\\bdry\\s*only\\b.*") ||
            normalizedName.equals("wash") ||
            normalizedName.equals("dry") ||
            normalizedName.equals("wash&dry") ||
            normalizedName.equals("wash and dry")) {
            return true;
        }
        
        // Check for standalone "wash" or "dry" that aren't part of other words
        if (normalizedName.matches("^wash$") || 
            normalizedName.matches("^dry$") ||
            normalizedName.matches("^wash\\d+$") ||
            normalizedName.matches("^dry\\d+$")) {
            return true;
        }
        
        return false;
    }

    // Mapping helpers
    private ServiceItemDto toDto(ServiceItem item) {
        return new ServiceItemDto(
            item.getId(),
            item.getName(),
            item.getDescription(),
            item.getPrice()
        );
    }

    private ServiceItem toEntity(ServiceItemDto dto) {
        return new ServiceItem(
            dto.getId(),
            dto.getName(),
            dto.getDescription(),
            dto.getPrice()
        );
    }
}