package com.starwash.authservice.controller;

import com.starwash.authservice.dto.InvoiceItemDto;
import com.starwash.authservice.dto.InvoiceSettingsDto;
import com.starwash.authservice.dto.ServiceEntryDto;
import com.starwash.authservice.model.InvoiceItem;
import com.starwash.authservice.model.InvoiceSettings;
import com.starwash.authservice.model.ServiceEntry;
import com.starwash.authservice.repository.InvoiceSettingsRepository;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.InvoiceService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "http://localhost:3000")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final JwtUtil jwtUtil;
    private final InvoiceSettingsRepository invoiceSettingsRepository;

    public InvoiceController(InvoiceService invoiceService, JwtUtil jwtUtil,
                             InvoiceSettingsRepository invoiceSettingsRepository) {
        this.invoiceService = invoiceService;
        this.jwtUtil = jwtUtil;
        this.invoiceSettingsRepository = invoiceSettingsRepository;
    }

    @GetMapping
    public ResponseEntity<List<InvoiceItemDto>> getAllInvoices(@RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        List<InvoiceItemDto> dtos = invoiceService.getAllInvoices().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceItemDto> getInvoiceById(@PathVariable String id,
                                                         @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        Optional<InvoiceItem> invoice = invoiceService.getInvoiceById(id);
        return invoice.map(i -> ResponseEntity.ok(toDto(i)))
                      .orElse(notFound());
    }

    @PostMapping
    public ResponseEntity<InvoiceItemDto> createInvoice(@RequestBody InvoiceItemDto dto,
                                                        @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();

        InvoiceItem entity = toEntity(dto);
        entity.setCreatedBy(jwtUtil.getUsername(extractToken(authHeader)));
        entity.setCreatedAt(LocalDateTime.now());
        entity.setLastUpdated(LocalDateTime.now());

        // ✅ Let service generate invoiceNumber if missing
        InvoiceItem saved = invoiceService.createInvoice(entity);

        // ✅ Return full DTO with invoiceNumber included
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceItemDto> updateInvoice(@PathVariable String id,
                                                        @RequestBody InvoiceItemDto dto,
                                                        @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        InvoiceItem entity = toEntity(dto);
        Optional<InvoiceItem> updated = invoiceService.updateInvoice(id, entity);
        return updated.map(i -> ResponseEntity.ok(toDto(i)))
                      .orElse(notFound());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable String id,
                                              @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        boolean deleted = invoiceService.deleteInvoice(id);
        return deleted ? ResponseEntity.ok().build() : notFound();
    }

    @GetMapping("/created-by/{username}")
    public ResponseEntity<List<InvoiceItemDto>> getInvoicesByCreator(@PathVariable String username,
                                                                     @RequestHeader("Authorization") String authHeader) {
        if (!isAuthorized(authHeader)) return unauthorized();
        List<InvoiceItemDto> dtos = invoiceService.getInvoicesByCreatedBy(username).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // 🔐 Token helpers
    private boolean isAuthorized(String authHeader) {
        return authHeader != null && authHeader.startsWith("Bearer ") &&
               jwtUtil.validateToken(extractToken(authHeader));
    }

    private String extractToken(String authHeader) {
        return authHeader.replace("Bearer ", "");
    }

    // 🧩 Mapping helpers
    private InvoiceItemDto toDto(InvoiceItem item) {
        List<ServiceEntryDto> services = item.getServices().stream()
                .map(s -> new ServiceEntryDto(s.getName(), s.getPrice(), s.getQuantity()))
                .collect(Collectors.toList());

        InvoiceSettingsDto settings = invoiceSettingsRepository.findTopByOrderByIdDesc()
                .map(this::toSettingsDto)
                .orElse(null);

        boolean isPaid = invoiceService.isTransactionPaid(item.getTransactionId());

        return new InvoiceItemDto(
                item.getId(),
                item.getInvoiceNumber(), // ✅ Confirmed mapping
                item.getTransactionId(),
                item.getIssueDate(),
                item.getDueDate(),
                item.getCustomerName(),
                services,
                item.getSubtotal(),
                item.getTax(),
                item.getDiscount(),
                item.getTotal(),
                item.getPaymentMethod(),
                isPaid,
                item.getCreatedBy(),
                item.getCreatedAt(),
                item.getLastUpdated(),
                settings
        );
    }

    private InvoiceItem toEntity(InvoiceItemDto dto) {
        List<ServiceEntry> services = dto.getServices().stream()
                .map(s -> new ServiceEntry(s.getName(), s.getPrice(), s.getQuantity()))
                .collect(Collectors.toList());

        InvoiceItem item = new InvoiceItem();
        item.setId(dto.getId());
        item.setInvoiceNumber(dto.getInvoiceNumber()); // ✅ Will be overridden if null
        item.setTransactionId(dto.getTransactionId());
        item.setIssueDate(dto.getIssueDate());
        item.setDueDate(dto.getDueDate());
        item.setCustomerName(dto.getCustomerName());
        item.setServices(services);
        item.setSubtotal(dto.getSubtotal() != null ? dto.getSubtotal() : 0.0);
        item.setTax(dto.getTax() != null ? dto.getTax() : 0.0);
        item.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : 0.0);
        item.setTotal(dto.getTotal() != null ? dto.getTotal() : 0.0);
        item.setPaymentMethod(dto.getPaymentMethod());
        item.setCreatedBy(dto.getCreatedBy());
        item.setCreatedAt(dto.getCreatedAt());
        item.setLastUpdated(dto.getLastUpdated());
        return item;
    }

    private InvoiceSettingsDto toSettingsDto(InvoiceSettings s) {
        return new InvoiceSettingsDto(
                s.getStoreName(),
                s.getAddress(),
                s.getPhone(),
                s.getFooterNote(),
                s.getTrackingUrl()
        );
    }

    // ✅ Generic response helpers
    private <T> ResponseEntity<T> notFound() {
        return ResponseEntity.status(404).build();
    }

    private <T> ResponseEntity<T> unauthorized() {
        return ResponseEntity.status(401).build();
    }
}