package com.starwash.authservice.service;

import com.starwash.authservice.model.ReceiptItem;
import com.starwash.authservice.repository.ReceiptRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReceiptService {

    private final ReceiptRepository receiptRepository;

    public ReceiptService(ReceiptRepository receiptRepository) {
        this.receiptRepository = receiptRepository;
    }

    // ✅ Get all receipts
    public List<ReceiptItem> getAllReceipts() {
        return receiptRepository.findAll();
    }

    // ✅ Get receipt by ID
    public Optional<ReceiptItem> getReceiptById(String id) {
        return receiptRepository.findById(id);
    }

    // ✅ Get receipt by receipt code (for public tracking)
    public Optional<ReceiptItem> getReceiptByReceiptCode(String receiptCode) {
        return receiptRepository.findByReceiptCode(receiptCode);
    }

    // ✅ Create new receipt
    public ReceiptItem createReceipt(ReceiptItem receipt) {
        receipt.setCreatedAt(LocalDateTime.now());
        receipt.setLastUpdated(LocalDateTime.now());
        return receiptRepository.save(receipt);
    }

    // ✅ Update existing receipt
    public Optional<ReceiptItem> updateReceipt(String id, ReceiptItem updated) {
        return receiptRepository.findById(id).map(existing -> {
            existing.setCustomerName(updated.getCustomerName());
            existing.setServices(updated.getServices());
            existing.setTotal(updated.getTotal());
            existing.setPaymentMethod(updated.getPaymentMethod());
            existing.setLastUpdated(LocalDateTime.now());
            return receiptRepository.save(existing);
        });
    }

    // ✅ Delete receipt by ID
    public boolean deleteReceipt(String id) {
        if (receiptRepository.existsById(id)) {
            receiptRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // 🔍 Get receipts created by a specific user
    public List<ReceiptItem> getReceiptsByCreatedBy(String username) {
        return receiptRepository.findByCreatedBy(username);
    }

    // 🔍 Optional: Get receipts by customer name
    public List<ReceiptItem> getReceiptsByCustomerName(String customerName) {
        return receiptRepository.findByCustomerName(customerName);
    }
}