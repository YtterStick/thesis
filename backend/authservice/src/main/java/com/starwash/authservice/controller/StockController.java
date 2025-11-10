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
@RequestMapping("")
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
        try {
            if (dto.getName() == null || dto.getUnit() == null) {
                return ResponseEntity.badRequest().body("Missing required fields: name or unit");
            }

            String token = authHeader.substring(7);
            String userId = jwtUtil.getUsername(token);

            StockItem newItem = new StockItem();
            newItem.setName(dto.getName());
            newItem.setUnit(dto.getUnit());
            newItem.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 0);
            newItem.setPrice(dto.getPrice() != null ? dto.getPrice() : 0.0);
            newItem.setCreatedAt(LocalDateTime.now());
            newItem.setLastUpdated(LocalDateTime.now());
            newItem.setLastRestock(LocalDateTime.now());
            newItem.setUpdatedBy(userId);

            // Thresholds
            newItem.setLowStockThreshold(dto.getLowStockThreshold());
            newItem.setAdequateStockThreshold(dto.getAdequateStockThreshold());
            newItem.setPreviousQuantity(dto.getPreviousQuantity());

            StockItem created = stockService.createItem(newItem);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating item: " + e.getMessage());
        }
    }

    @PutMapping("/stock/{id}")
    public ResponseEntity<?> updateStockItem(@PathVariable String id,
                                             @RequestBody StockItemDto dto,
                                             @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract user ID from token
            String token = authHeader.substring(7);
            String userId = jwtUtil.getUsername(token);

            // Create StockItem from DTO
            StockItem updatedItem = new StockItem();
            updatedItem.setName(dto.getName());
            updatedItem.setQuantity(dto.getQuantity());
            updatedItem.setUnit(dto.getUnit());
            updatedItem.setPrice(dto.getPrice());
            updatedItem.setLowStockThreshold(dto.getLowStockThreshold());
            updatedItem.setAdequateStockThreshold(dto.getAdequateStockThreshold());
            updatedItem.setUpdatedBy(userId);

            Optional<StockItem> result = stockService.updateItem(id, updatedItem);
            return result.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
                        
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating item: " + e.getMessage());
        }
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
        try {
            if (amount <= 0) {
                return ResponseEntity.badRequest().body("Invalid restock amount");
            }
            
            String token = authHeader.substring(7);
            String userId = jwtUtil.getUsername(token);
            
            Optional<StockItem> item = stockService.addStock(id, amount, userId);
            return item.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error restocking item: " + e.getMessage());
        }
    }
}