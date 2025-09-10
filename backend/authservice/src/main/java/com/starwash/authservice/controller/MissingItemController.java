package com.starwash.authservice.controller;

import com.starwash.authservice.model.MissingItem;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.MissingItemService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missing-items")
@CrossOrigin(origins = "http://localhost:3000")
public class MissingItemController {

    private static final Logger log = LoggerFactory.getLogger(MissingItemController.class);

    private final MissingItemService missingItemService;
    private final JwtUtil jwtUtil;

    public MissingItemController(MissingItemService missingItemService, JwtUtil jwtUtil) {
        this.missingItemService = missingItemService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<MissingItem> reportMissingItem(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody MissingItemRequest request) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            String token = authHeader.replace("Bearer ", "");
            String staffId = jwtUtil.extractUsername(token);

            MissingItem missingItem = missingItemService.reportMissingItem(
                    request.getItemDescription(),
                    request.getMachineId(),
                    staffId,
                    request.getNotes()
            );

            log.info("✅ Missing item reported | item={} | machine={} | staff={}",
                    request.getItemDescription(), request.getMachineId(), staffId);

            return ResponseEntity.ok(missingItem);

        } catch (Exception e) {
            log.error("❌ Failed to report missing item: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PatchMapping("/{itemId}/claim")
    public ResponseEntity<MissingItem> claimItem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String itemId,
            @RequestBody ClaimRequest request) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            MissingItem claimedItem = missingItemService.claimItem(itemId, request.getClaimedByName());

            log.info("✅ Missing item claimed | itemId={} | claimedBy={}", itemId, request.getClaimedByName());

            return ResponseEntity.ok(claimedItem);

        } catch (RuntimeException e) {
            log.error("❌ Failed to claim item: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("❌ Error claiming item: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<MissingItem>> getMissingItems(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Boolean unclaimed,
            @RequestParam(required = false) String machineId) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<MissingItem> items;
            
            if (Boolean.TRUE.equals(unclaimed)) {
                items = missingItemService.getUnclaimedItems();
            } else if (machineId != null) {
                items = missingItemService.getItemsByMachine(machineId);
            } else {
                items = missingItemService.getAllItems();
            }

            return ResponseEntity.ok(items);

        } catch (Exception e) {
            log.error("❌ Failed to fetch missing items: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/today")
    public ResponseEntity<List<MissingItem>> getTodayItems(
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<MissingItem> items = missingItemService.getTodayItems();
            return ResponseEntity.ok(items);

        } catch (Exception e) {
            log.error("❌ Failed to fetch today's missing items: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<MissingItem>> searchItems(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String q) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            List<MissingItem> items = missingItemService.searchItems(q);
            return ResponseEntity.ok(items);

        } catch (Exception e) {
            log.error("❌ Failed to search missing items: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<MissingItem> updateItem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String itemId,
            @RequestBody UpdateItemRequest request) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            MissingItem updatedItem = missingItemService.updateItem(
                    itemId, request.getItemDescription(), request.getNotes()
            );

            return ResponseEntity.ok(updatedItem);

        } catch (RuntimeException e) {
            log.error("❌ Failed to update item: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("❌ Error updating item: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteItem(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String itemId) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        try {
            missingItemService.deleteItem(itemId);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("❌ Failed to delete item: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Request DTOs
    public static class MissingItemRequest {
        private String itemDescription;
        private String machineId;
        private String notes;

        // Getters and setters
        public String getItemDescription() { return itemDescription; }
        public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }
        public String getMachineId() { return machineId; }
        public void setMachineId(String machineId) { this.machineId = machineId; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class ClaimRequest {
        private String claimedByName;

        public String getClaimedByName() { return claimedByName; }
        public void setClaimedByName(String claimedByName) { this.claimedByName = claimedByName; }
    }

    public static class UpdateItemRequest {
        private String itemDescription;
        private String notes;

        public String getItemDescription() { return itemDescription; }
        public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}