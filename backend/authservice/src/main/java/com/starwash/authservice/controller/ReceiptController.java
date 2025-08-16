package com.starwash.authservice.controller;

import com.starwash.authservice.dto.ReceiptItemDto;
import com.starwash.authservice.dto.ReceiptSettingsDto;
import com.starwash.authservice.dto.ServiceEntryDto;
import com.starwash.authservice.model.ReceiptItem;
import com.starwash.authservice.model.ReceiptSettings;
import com.starwash.authservice.model.ServiceEntry;
import com.starwash.authservice.repository.ReceiptSettingsRepository;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.ReceiptService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "http://localhost:3000")
public class ReceiptController {

    private final ReceiptService receiptService;
    private final JwtUtil jwtUtil;
    private final ReceiptSettingsRepository receiptSettingsRepository;

    public ReceiptController(ReceiptService receiptService, JwtUtil jwtUtil,
                             ReceiptSettingsRepository receiptSettingsRepository) {
        this.receiptService = receiptService;
        this.jwtUtil = jwtUtil;
        this.receiptSettingsRepository = receiptSettingsRepository;
    }

    @GetMapping
    public ResponseEntity<List<ReceiptItemDto>> getAllReceipts(@RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        List<ReceiptItemDto> dtos = receiptService.getAllReceipts().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceiptItemDto> getReceiptById(@PathVariable String id,
                                                         @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        Optional<ReceiptItem> receipt = receiptService.getReceiptById(id);
        return receipt.map(r -> ResponseEntity.ok(toDto(r)))
                      .orElse(notFound());
    }

    @GetMapping("/track/{receiptCode}")
    public ResponseEntity<ReceiptItemDto> trackReceipt(@PathVariable String receiptCode) {
        Optional<ReceiptItem> receipt = receiptService.getReceiptByReceiptCode(receiptCode);
        return receipt.map(this::toDto)
                      .map(ResponseEntity::ok)
                      .orElse(notFound());
    }

    @PostMapping
    public ResponseEntity<ReceiptItemDto> createReceipt(@RequestBody ReceiptItemDto dto,
                                                        @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        ReceiptItem entity = toEntity(dto);
        entity.setCreatedBy(jwtUtil.getUsername(extractToken(authHeader)));
        entity.setCreatedAt(LocalDateTime.now());
        entity.setLastUpdated(LocalDateTime.now());
        ReceiptItem saved = receiptService.createReceipt(entity);
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReceiptItemDto> updateReceipt(@PathVariable String id,
                                                        @RequestBody ReceiptItemDto dto,
                                                        @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        ReceiptItem entity = toEntity(dto);
        Optional<ReceiptItem> updated = receiptService.updateReceipt(id, entity);
        return updated.map(r -> ResponseEntity.ok(toDto(r)))
                      .orElse(notFound());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReceipt(@PathVariable String id,
                                              @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        boolean deleted = receiptService.deleteReceipt(id);
        return deleted ? ResponseEntity.ok().build() : notFound();
    }

    @GetMapping("/created-by/{username}")
    public ResponseEntity<List<ReceiptItemDto>> getReceiptsByCreator(@PathVariable String username,
                                                                     @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        List<ReceiptItemDto> dtos = receiptService.getReceiptsByCreatedBy(username).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    private boolean isAuthorized(String authHeader) {
        return authHeader != null && authHeader.startsWith("Bearer ") &&
               jwtUtil.validateToken(extractToken(authHeader));
    }

    private String extractToken(String authHeader) {
        return authHeader.replace("Bearer ", "");
    }

    private ReceiptItemDto toDto(ReceiptItem item) {
        List<ServiceEntryDto> services = item.getServices().stream()
                .map(s -> new ServiceEntryDto(s.getName(), s.getPrice(), s.getQuantity()))
                .collect(Collectors.toList());

        ReceiptSettingsDto settings = receiptSettingsRepository.findTopByOrderByIdDesc()
                .map(this::toSettingsDto)
                .orElse(null);

        ReceiptItemDto dto = new ReceiptItemDto(
                item.getId(),
                item.getCustomerName(),
                services,
                item.getTotal(),
                item.getPaymentMethod(),
                item.getCreatedBy(),
                item.getCreatedAt(),
                item.getLastUpdated()
        );
        dto.setSettings(settings);
        return dto;
    }

    private ReceiptSettingsDto toSettingsDto(ReceiptSettings s) {
        return new ReceiptSettingsDto(
                s.getStoreName(),
                s.getAddress(),
                s.getPhone(),
                s.getFooterNote(),
                s.getTrackingUrl()
        );
    }

    private ReceiptItem toEntity(ReceiptItemDto dto) {
        List<ServiceEntry> services = dto.getServices().stream()
                .map(s -> new ServiceEntry(s.getName(), s.getPrice(), s.getQuantity()))
                .collect(Collectors.toList());

        ReceiptItem item = new ReceiptItem();
        item.setId(dto.getId());
        item.setCustomerName(dto.getCustomerName());
        item.setServices(services);
        item.setTotal(dto.getTotal() != null ? dto.getTotal() : 0.0);
        item.setPaymentMethod(dto.getPaymentMethod());
        item.setCreatedBy(dto.getCreatedBy());
        item.setCreatedAt(dto.getCreatedAt());
        item.setLastUpdated(dto.getLastUpdated());
        return item;
    }

    private <T> ResponseEntity<T> notFound() {
        return ResponseEntity.status(404).build();
    }

    private <T> ResponseEntity<T> unauthorized() {
        return ResponseEntity.status(401).build();
    }
}