package com.starwash.authservice.repository;

import com.starwash.authservice.model.InvoiceItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends MongoRepository<InvoiceItem, String> {

    // 🔍 Find invoices created by a specific staff user
    List<InvoiceItem> findByCreatedBy(String createdBy);

    // 🔍 Optional: filter by customer name
    List<InvoiceItem> findByCustomerName(String customerName);

    // ✅ Find invoice by transaction ID
    Optional<InvoiceItem> findByTransactionId(String transactionId);

    // ✅ NEW: Find invoice by invoice number (for public tracking)
    Optional<InvoiceItem> findByInvoiceNumber(String invoiceNumber);
}