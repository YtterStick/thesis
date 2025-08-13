package com.starwash.authservice.service;

import com.starwash.authservice.model.InvoiceItem;
import com.starwash.authservice.repository.InvoiceRepository;
import com.starwash.authservice.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final TransactionRepository transactionRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          TransactionRepository transactionRepository) {
        this.invoiceRepository = invoiceRepository;
        this.transactionRepository = transactionRepository;
    }

    // ✅ Get all invoices
    public List<InvoiceItem> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    // ✅ Get invoice by ID
    public Optional<InvoiceItem> getInvoiceById(String id) {
        return invoiceRepository.findById(id);
    }

    // ✅ Create new invoice with auto-generated metadata
    public InvoiceItem createInvoice(InvoiceItem invoice) {
        LocalDateTime now = LocalDateTime.now();

        invoice.setCreatedAt(now);
        invoice.setLastUpdated(now);

        invoice.setIssueDate(now);
        invoice.setDueDate(now.plusDays(7));

        if (invoice.getTransactionId() == null || invoice.getTransactionId().isEmpty()) {
            throw new IllegalArgumentException("Transaction ID is required for invoice creation.");
        }

        String prefix = "INV-" + now.getYear();
        long count = invoiceRepository.count();
        invoice.setInvoiceNumber(prefix + "-" + String.format("%04d", count + 1));

        return invoiceRepository.save(invoice);
    }

    // ✅ Update existing invoice (transactionId is immutable)
    public Optional<InvoiceItem> updateInvoice(String id, InvoiceItem updated) {
        return invoiceRepository.findById(id).map(existing -> {
            existing.setInvoiceNumber(updated.getInvoiceNumber());

            // Prevent overwriting transactionId
            if (existing.getTransactionId() == null && updated.getTransactionId() != null) {
                existing.setTransactionId(updated.getTransactionId());
            }

            existing.setIssueDate(updated.getIssueDate());
            existing.setDueDate(updated.getDueDate());

            existing.setCustomerName(updated.getCustomerName());
            existing.setServices(updated.getServices());

            existing.setSubtotal(updated.getSubtotal());
            existing.setTax(updated.getTax());
            existing.setDiscount(updated.getDiscount());
            existing.setTotal(updated.getTotal());

            existing.setPaymentMethod(updated.getPaymentMethod());

            existing.setLastUpdated(LocalDateTime.now());
            return invoiceRepository.save(existing);
        });
    }

    // ✅ Delete invoice by ID
    public boolean deleteInvoice(String id) {
        if (invoiceRepository.existsById(id)) {
            invoiceRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // 🔍 Get invoices created by a specific user
    public List<InvoiceItem> getInvoicesByCreatedBy(String username) {
        return invoiceRepository.findByCreatedBy(username);
    }

    // 🔍 Optional: Get invoices by customer name
    public List<InvoiceItem> getInvoicesByCustomerName(String customerName) {
        return invoiceRepository.findByCustomerName(customerName);
    }

    // ✅ Derive payment status from linked transaction
    public boolean isTransactionPaid(String transactionId) {
        return transactionRepository.findById(transactionId)
                .map(t -> "Paid".equalsIgnoreCase(t.getStatus()))
                .orElse(false);
    }
}