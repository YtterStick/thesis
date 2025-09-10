package com.starwash.authservice.service;

import com.starwash.authservice.model.MissingItem;
import com.starwash.authservice.repository.MissingItemRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class MissingItemService {

    private final MissingItemRepository missingItemRepository;

    public MissingItemService(MissingItemRepository missingItemRepository) {
        this.missingItemRepository = missingItemRepository;
    }

    public MissingItem reportMissingItem(String itemDescription, String machineId, String staffId, String notes) {
        MissingItem missingItem = new MissingItem(itemDescription, machineId, staffId);
        missingItem.setNotes(notes);
        return missingItemRepository.save(missingItem);
    }

    public MissingItem claimItem(String itemId, String claimedByName) {
        MissingItem missingItem = missingItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Missing item not found"));
        
        missingItem.setClaimed(true);
        missingItem.setClaimedBy(claimedByName);
        missingItem.setClaimedDate(LocalDateTime.now());
        
        return missingItemRepository.save(missingItem);
    }

    public List<MissingItem> getUnclaimedItems() {
        return missingItemRepository.findByIsClaimed(false);
    }

    public List<MissingItem> getAllItems() {
        return missingItemRepository.findAll();
    }

    public List<MissingItem> getItemsByMachine(String machineId) {
        return missingItemRepository.findByFoundInMachineId(machineId);
    }

    public List<MissingItem> getTodayItems() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        return missingItemRepository.findByFoundDateBetween(startOfDay, endOfDay);
    }

    public List<MissingItem> getItemsByMachineToday(String machineId) {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        return missingItemRepository.findByDateRangeAndMachine(startOfDay, endOfDay, machineId);
    }

    public List<MissingItem> searchItems(String searchTerm) {
        return missingItemRepository.findByItemDescriptionContainingIgnoreCase(searchTerm);
    }

    public MissingItem updateItem(String itemId, String description, String notes) {
        MissingItem missingItem = missingItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Missing item not found"));
        
        missingItem.setItemDescription(description);
        missingItem.setNotes(notes);
        
        return missingItemRepository.save(missingItem);
    }

    public void deleteItem(String itemId) {
        missingItemRepository.deleteById(itemId);
    }
}