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
@RequestMapping("/api/services")
public class ServiceController {

  @Autowired
  private ServiceRepository serviceRepository;

  // Permanent service names that cannot be modified or deleted
  private static final String[] PERMANENT_SERVICES = {"Wash & Dry", "Wash", "Dry"};

  // GET all services
  @GetMapping
  public ResponseEntity<List<ServiceItemDto>> getAllServices() {
    List<ServiceItemDto> dtos = serviceRepository.findAll().stream()
      .map(this::toDto)
      .collect(Collectors.toList());
    return ResponseEntity.ok(dtos);
  }

  // POST create new service
  @PostMapping
  public ResponseEntity<?> createService(@RequestBody ServiceItemDto dto) {
    String serviceName = dto.getName().trim();
    
    // Validate service name
    ResponseEntity<?> validationResponse = validateServiceName(serviceName, null);
    if (validationResponse != null) {
      return validationResponse;
    }
    
    // Check for duplicates
    if (serviceRepository.findByNameIgnoreCase(serviceName).isPresent()) {
      return ResponseEntity.badRequest().body("Service with this name already exists");
    }

    ServiceItem item = toEntity(dto);
    item.setId(null); // Ensure new ID is generated
    ServiceItem saved = serviceRepository.save(item);
    return ResponseEntity.ok(toDto(saved));
  }

  // PUT update existing service
  @PutMapping("/{id}")
  public ResponseEntity<?> updateService(@PathVariable String id, @RequestBody ServiceItemDto dto) {
    Optional<ServiceItem> existingOpt = serviceRepository.findById(id);
    if (!existingOpt.isPresent()) {
      return ResponseEntity.notFound().build();
    }

    ServiceItem existing = existingOpt.get();
    String newName = dto.getName().trim();
    String oldName = existing.getName();

    // Check if trying to modify permanent service
    if (isPermanentService(oldName) && !oldName.equals(newName)) {
      return ResponseEntity.badRequest().body("Cannot modify the permanent service: " + oldName);
    }

    // Validate service name
    ResponseEntity<?> validationResponse = validateServiceName(newName, oldName);
    if (validationResponse != null) {
      return validationResponse;
    }

    // Check for duplicates (excluding current service)
    Optional<ServiceItem> duplicate = serviceRepository.findByNameIgnoreCase(newName);
    if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
      return ResponseEntity.badRequest().body("Service with this name already exists");
    }

    existing.setName(newName);
    existing.setDescription(dto.getDescription());
    existing.setPrice(dto.getPrice());
    ServiceItem updated = serviceRepository.save(existing);
    return ResponseEntity.ok(toDto(updated));
  }

  // DELETE service by ID
  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteService(@PathVariable String id) {
    Optional<ServiceItem> serviceOpt = serviceRepository.findById(id);
    if (!serviceOpt.isPresent()) {
      return ResponseEntity.notFound().build();
    }

    ServiceItem service = serviceOpt.get();
    
    // Prevent deletion of permanent services
    if (isPermanentService(service.getName())) {
      return ResponseEntity.badRequest().body("Cannot delete the permanent service: " + service.getName());
    }

    serviceRepository.deleteById(id);
    return ResponseEntity.ok().build();
  }

  // Helper method to check if service is permanent
  private boolean isPermanentService(String serviceName) {
    for (String permanentService : PERMANENT_SERVICES) {
      if (permanentService.equals(serviceName)) {
        return true;
      }
    }
    return false;
  }

  // Helper method to validate service names
  private ResponseEntity<?> validateServiceName(String serviceName, String oldName) {
    String normalized = serviceName.toLowerCase().trim();
    
    // Prevent any variations of permanent service names
    for (String permanentService : PERMANENT_SERVICES) {
      String permanentNormalized = permanentService.toLowerCase();
      
      // Exact match check
      if (normalized.equals(permanentNormalized)) {
        // Allow if it's the same service being updated
        if (oldName != null && oldName.equals(serviceName)) {
          return null;
        }
        return ResponseEntity.badRequest().body("Service name '" + serviceName + "' is reserved and cannot be used");
      }
      
      // Partial match check to prevent variations
      if (normalized.contains("wash") || normalized.contains("dry")) {
        if (normalized.startsWith("wash") || normalized.startsWith("dry") || 
            normalized.endsWith("wash") || normalized.endsWith("dry") ||
            normalized.contains("wash & dry") || normalized.contains("wash and dry")) {
          return ResponseEntity.badRequest().body("Service name cannot contain variations of 'Wash', 'Dry', or 'Wash & Dry'");
        }
      }
    }
    
    // Additional checks for numbered variations
    if (normalized.matches(".*wash\\s*\\d.*") || normalized.matches(".*dry\\s*\\d.*") ||
        normalized.matches(".*wash&dry\\s*\\d.*") || normalized.matches(".*wash\\s*&\\s*dry\\s*\\d.*")) {
      return ResponseEntity.badRequest().body("Service name cannot contain numbered variations of permanent services");
    }
    
    return null;
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