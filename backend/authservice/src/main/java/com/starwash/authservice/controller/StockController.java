package com.starwash.authservice.controller;

import com.starwash.authservice.dto.StockItemDto;
import com.starwash.authservice.model.StockItem;
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

    public StockController(StockService stockService) {
        this.stockService = stockService;
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
    public ResponseEntity<?> createStockItem(@RequestBody StockItemDto dto) {
        if (dto.getName() == null || dto.getUnit() == null) {
            return ResponseEntity.badRequest().body("Missing required fields: name or unit");
        }

        StockItem newItem = new StockItem();
        newItem.setName(dto.getName());
        newItem.setUnit(dto.getUnit());
        newItem.setQuantity(dto.getQuantity());
        newItem.setPrice(dto.getPrice());
        newItem.setCreatedAt(LocalDateTime.now());
        newItem.setLastUpdated(LocalDateTime.now());
        newItem.setLastRestock(LocalDateTime.now());
        newItem.setUpdatedBy(dto.getUpdatedBy());

        StockItem created = stockService.createItem(newItem);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/stock/{id}")
    public ResponseEntity<?> updateStockItem(@PathVariable String id,
                                             @RequestBody StockItemDto dto) {
        Optional<StockItem> existingOpt = stockService.getItemById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StockItem existing = existingOpt.get();

        // Apply updates only if fields are present
        if (dto.getName() != null) existing.setName(dto.getName());
        if (dto.getUnit() != null) existing.setUnit(dto.getUnit());
        if (dto.getQuantity() != null) existing.setQuantity(dto.getQuantity());
        if (dto.getPrice() != null) existing.setPrice(dto.getPrice());
        if (dto.getUpdatedBy() != null) existing.setUpdatedBy(dto.getUpdatedBy());

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
                                      @RequestParam int amount) {
        if (amount <= 0) {
            return ResponseEntity.badRequest().body("Invalid restock amount");
        }

        Optional<StockItem> item = stockService.addStock(id, amount);
        return item.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }
}