package com.starwash.authservice.service;

import com.starwash.authservice.model.MissingItem;
import com.starwash.authservice.repository.MissingItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MissingItemService {

    @Autowired
    private MissingItemRepository missingItemRepository;

    public List<MissingItem> getAllMissingItems() {
        return missingItemRepository.findAll();
    }

    public List<MissingItem> getUnclaimedItems() {
        return missingItemRepository.findByIsClaimed(false);
    }

    public List<MissingItem> getClaimedItems() {
        return missingItemRepository.findByIsClaimed(true);
    }

    public MissingItem createMissingItem(MissingItem missingItem, String staffId) {
        missingItem.setFoundByStaffId(staffId);
        return missingItemRepository.save(missingItem);
    }

    public Optional<MissingItem> claimItem(String id, String claimedByName) {
        Optional<MissingItem> optionalItem = missingItemRepository.findById(id);
        if (optionalItem.isPresent()) {
            MissingItem item = optionalItem.get();
            item.setClaimed(true);
            item.setClaimedByName(claimedByName);
            item.setClaimDate(LocalDateTime.now());
            return Optional.of(missingItemRepository.save(item));
        }
        return Optional.empty();
    }

    public Optional<MissingItem> getItemById(String id) {
        return missingItemRepository.findById(id);
    }

    public boolean deleteItem(String id) {
        if (missingItemRepository.existsById(id)) {
            missingItemRepository.deleteById(id);
            return true;
        }
        return false;
    }
}