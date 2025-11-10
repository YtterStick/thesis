package com.starwash.authservice.controller;

import com.starwash.authservice.model.MissingItem;
import com.starwash.authservice.security.JwtUtil;
import com.starwash.authservice.service.MissingItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/missing-items")
@CrossOrigin(origins = "http://localhost:3000")
public class MissingItemController {

    @Autowired
    private MissingItemService missingItemService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<MissingItem>> getAllMissingItems() {
        return ResponseEntity.ok(missingItemService.getAllMissingItems());
    }

    @GetMapping("/unclaimed")
    public ResponseEntity<List<MissingItem>> getUnclaimedItems() {
        return ResponseEntity.ok(missingItemService.getUnclaimedItems());
    }

    @GetMapping("/claimed")
    public ResponseEntity<List<MissingItem>> getClaimedItems() {
        return ResponseEntity.ok(missingItemService.getClaimedItems());
    }

    @PostMapping
    public ResponseEntity<MissingItem> createMissingItem(@RequestBody MissingItem missingItem,
            @RequestHeader("Authorization") String authHeader) {
        String staffId = jwtUtil.getUsername(authHeader.replace("Bearer ", ""));
        MissingItem createdItem = missingItemService.createMissingItem(missingItem, staffId);
        return ResponseEntity.ok(createdItem);
    }

    @PatchMapping("/{id}/claim")
    public ResponseEntity<MissingItem> claimItem(@PathVariable String id,
            @RequestBody ClaimRequest claimRequest,
            @RequestHeader("Authorization") String authHeader) {
        Optional<MissingItem> claimedItem = missingItemService.claimItem(id, claimRequest.getClaimedByName());
        if (claimedItem.isPresent()) {
            return ResponseEntity.ok(claimedItem.get());
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        if (missingItemService.deleteItem(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Inner class for claim request
    public static class ClaimRequest {
        private String claimedByName;

        public String getClaimedByName() {
            return claimedByName;
        }

        public void setClaimedByName(String claimedByName) {
            this.claimedByName = claimedByName;
        }
    }
}