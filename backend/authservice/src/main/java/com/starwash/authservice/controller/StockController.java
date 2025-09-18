package com.starwash.authservice.controller;

import com.starwash.authservice.dto.StockItemDto;
import com.starwash.authservice.model.StockItem;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class StockController {

    private final StockService stockService;
    private final JwtUtil jwtUtil;

    public StockController(StockService stockService, JwtUtil jwtUtil) {
        this.stockService = stockService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/stock")
    public List<StockItem> getAllStockItems() {
        return stockService.getAllItems();
    }

    @GetMapping("/stock/{id}")
    public ResponseEntity<StockItem> getStockItemById(@PathVariable String id) {
        Optional<StockItem> item = stockService.getItemById(id);
        return item.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/stock")
    public ResponseEntity<?> createStockItem(@RequestBody StockItemDto dto,
                                             @RequestHeader("Authorization") String authHeader) {
        if (dto.getName() == null || dto.getUnit() == null) {
            return ResponseEntity.badRequest().body("Missing required fields: name or unit");
        }

        String token = authHeader.substring(7);
        String userId = jwtUtil.getUsername(token);

        StockItem newItem = new StockItem();
        newItem.setName(dto.getName());
        newItem.setUnit(dto.getUnit());
        newItem.setQuantity(dto.getQuantity());
        newItem.setPrice(dto.getPrice());
        newItem.setCreatedAt(LocalDateTime.now());
        newItem.setLastUpdated(LocalDateTime.now());
        newItem.setLastRestock(LocalDateTime.now());
        newItem.setUpdatedBy(userId); // Set the user ID from token

        // ✅ Thresholds and previous quantity
        newItem.setLowStockThreshold(dto.getLowStockThreshold());
        newItem.setAdequateStockThreshold(dto.getAdequateStockThreshold());
        newItem.setPreviousQuantity(dto.getPreviousQuantity());

        StockItem created = stockService.createItem(newItem);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/stock/{id}")
    public ResponseEntity<?> updateStockItem(@PathVariable String id,
                                             @RequestBody StockItemDto dto,
                                             @RequestHeader("Authorization") String authHeader) {
        Optional<StockItem> existingOpt = stockService.getItemById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Extract user ID from token
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        String userId = jwtUtil.getUsername(token);

        StockItem existing = existingOpt.get();

        // Apply updates only if fields are present
        if (dto.getName() != null) existing.setName(dto.getName());
        if (dto.getUnit() != null) existing.setUnit(dto.getUnit());
        if (dto.getQuantity() != null) existing.setQuantity(dto.getQuantity());
        if (dto.getPrice() != null) existing.setPrice(dto.getPrice());
        existing.setUpdatedBy(userId); // Set the user ID from token
        if (dto.getLowStockThreshold() != null) existing.setLowStockThreshold(dto.getLowStockThreshold());
        if (dto.getAdequateStockThreshold() != null) existing.setAdequateStockThreshold(dto.getAdequateStockThreshold());
        if (dto.getPreviousQuantity() != null) existing.setPreviousQuantity(dto.getPreviousQuantity());

        existing.setLastUpdated(LocalDateTime.now());

        StockItem updated = stockService.createItem(existing); // reuse save logic
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/stock/{id}")
    public ResponseEntity<Void> deleteStockItem(@PathVariable String id) {
        boolean deleted = stockService.deleteItem(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/stock/{id}/restock")
    public ResponseEntity<?> addStock(@PathVariable String id,
                                      @RequestParam int amount,
                                      @RequestHeader("Authorization") String authHeader) {
        if (amount <= 0) {
            return ResponseEntity.badRequest().body("Invalid restock amount");
        }
        
        String token = authHeader.substring(7);
        String userId = jwtUtil.getUsername(token);
        
        Optional<StockItem> item = stockService.addStock(id, amount, userId);
        return item.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }
}