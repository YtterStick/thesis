package com.starwash.authservice.service;

import com.starwash.authservice.dto.TransactionRequestDto;
import com.starwash.authservice.model.InvoiceItem;
import com.starwash.authservice.model.ServiceEntry;
import com.starwash.authservice.model.Transaction;
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

    // ✅ Get invoice by invoice number (for public tracking)
    public Optional<InvoiceItem> getInvoiceByInvoiceNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
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

        String invoiceCode = "I-" + Long.toString(System.currentTimeMillis(), 36);
        invoice.setInvoiceNumber(invoiceCode);

        return invoiceRepository.save(invoice);
    }

    // ✅ Create invoice from transaction
    public InvoiceItem createInvoiceFromTransaction(Transaction transaction, TransactionRequestDto request) {
        InvoiceItem invoice = new InvoiceItem();

        invoice.setTransactionId(transaction.getId());
        invoice.setCustomerName(transaction.getCustomerName());

        List<ServiceEntry> allServices = transaction.getConsumables();
        allServices.add(new ServiceEntry(
                transaction.getServiceName(),
                transaction.getServicePrice(),
                transaction.getServiceQuantity()
        ));
        invoice.setServices(allServices);

        invoice.setSubtotal(transaction.getTotalPrice());
        invoice.setTax(0.0);
        invoice.setDiscount(0.0);
        invoice.setTotal(transaction.getTotalPrice());

        invoice.setPaymentMethod("Paid".equalsIgnoreCase(transaction.getStatus()) ? "Cash" : null);
        invoice.setCreatedBy("system");

        return createInvoice(invoice);
    }

    // ✅ Update existing invoice
    public Optional<InvoiceItem> updateInvoice(String id, InvoiceItem updated) {
        return invoiceRepository.findById(id).map(existing -> {
            existing.setInvoiceNumber(updated.getInvoiceNumber());

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

    // ✅ Get invoice by transaction ID
    public InvoiceItem getInvoiceByTransactionId(String transactionId) {
        return invoiceRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Invoice not found for transaction: " + transactionId));
    }
}