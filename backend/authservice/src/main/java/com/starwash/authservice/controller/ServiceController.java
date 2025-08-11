package com.starwash.authservice.controller;

import com.starwash.authservice.dto.ServiceItemDto;
import com.starwash.authservice.model.ServiceItem;
import com.starwash.authservice.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

  @Autowired
  private ServiceRepository serviceRepository;

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
  public ResponseEntity<ServiceItemDto> createService(@RequestBody ServiceItemDto dto) {
    ServiceItem item = toEntity(dto);
    item.setId(null); // Ensure new ID is generated
    ServiceItem saved = serviceRepository.save(item);
    return ResponseEntity.ok(toDto(saved));
  }

  // PUT update existing service
  @PutMapping("/{id}")
  public ResponseEntity<ServiceItemDto> updateService(@PathVariable String id, @RequestBody ServiceItemDto dto) {
    return serviceRepository.findById(id)
      .map(existing -> {
        existing.setName(dto.getName());
        existing.setDescription(dto.getDescription());
        existing.setPrice(dto.getPrice());
        ServiceItem updated = serviceRepository.save(existing);
        return ResponseEntity.ok(toDto(updated));
      })
      .orElse(ResponseEntity.notFound().build());
  }

  // DELETE service by ID
  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteService(@PathVariable String id) {
    if (!serviceRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    serviceRepository.deleteById(id);
    return ResponseEntity.ok().build();
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