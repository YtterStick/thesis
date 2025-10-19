# 🧾 Transaction System Documentation

## Overview

This document explains the transaction page implementation for a **laundry service system**.  
The system handles customer transactions, service selection, payment processing, and **dynamic receipt generation**.

---

## 🎯 Key Challenge: Dynamic Receipt Generation

**Problem:**  
Needed to generate service invoice receipts **without storing them directly in MongoDB** to avoid database bloat.

**Solution:**  
Designed a system where receipts are dynamically generated using existing backend data:

- 🗂️ **No Receipt Storage:** Receipts aren't saved as separate documents in MongoDB
- 🔁 **Dynamic Mapping:** Re-fetches transaction data and maps it into a receipt preview
- 💾 **Flexible Output:** Staff can print or save locally, but not persisted in backend
- ♻️ **Reproducible:** Can be recreated identically anytime from transaction data

---

## 🏗️ System Architecture

### 🖥️ Frontend Components

---

### **MainPage Component**

// Core transaction flow controller
// - Manages form state and invoice generation
// - Handles print functionality with browser events
// - Controls transaction submission and UI states

## 🚀 Key Features

- 🔄 **Real-Time Preview Updates:**  
  Transaction data is reflected instantly in the UI, ensuring accurate previews before finalization.

- 🖨️ **Print Mode Handling:**  
  Optimized layout and styling adjustments for clean, professional receipt printing.

- ✅ **Transaction Completion Modal:**  
  A confirmation modal appears post-payment, summarizing transaction details and offering next steps.

- ⚠️ **Error State Management:**  
  Robust handling of edge cases and failures, with clear feedback and recovery options for staff.

# TransactionForm Component

// Complex form handling with multiple data sources
// - Customer information validation
// - Service and consumable selection
// - Payment method handling
// - Dynamic data caching

# Where I Struggled

// Data caching implementation was challenging
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache
const POLLING_INTERVAL = 60000; // 1 minute polling

// Cache synchronization between multiple data sources
const fetchFreshData = async () => {
    const [servicesData, stockData, paymentData] = await Promise.all([
        api.get("api/services"),
        api.get("api/stock"),
        api.get("api/payment-settings"),
    ]);

    // Ensuring cache consistency across different data types was complex
};

# ConsumablesSection Component

// Dynamic consumable management
// - Plastic items auto-sync with load counts
// - Supply source-based UI rendering
// - Real-time quantity validation

# Learning Challenge

// Managing plastic overrides while maintaining auto-sync
useEffect(() => {
  const expected = parseInt(loads) || 1;
  const plasticItems = stockItems.filter((item) => 
    item.name.toLowerCase().includes("plastic")
  );

  // Tracking overrides while allowing automatic updates
  plasticItems.forEach((item) => {
    if (!plasticOverrides[name] && consumables[name] !== expected) {
      updated[name] = expected; // Auto-update non-overridden items
    }
  });
}, [loads, stockItems, plasticOverrides, consumables]);

# ServiceInvoiceCard Component

// Dynamic receipt generation
// - QR code integration for tracking
// - Print-optimized styling
// - Backend data mapping to receipt format

# Backend Services

## TransactionService (Java/Spring Boot)


@Service
public class TransactionService {
    // Manila timezone handling for consistent dates
    private ZoneId getManilaTimeZone() {
        return ZoneId.of("Asia/Manila");
    }
    
    // Dynamic invoice generation without storage
    public ServiceInvoiceDto createServiceInvoiceTransaction(TransactionRequestDto request, String staffId) {
        // Calculate totals dynamically
        // Generate consumable breakdown
        // Create transaction record without storing receipt
    }
}


# 🎓 Learning Challenges & Solutions

## 1. State Management Complexity

**Problem:** Managing form state, preview data, and invoice state simultaneously  

**Solution:** Implemented layered state management:

const [form, setForm] = useState({ /* form fields */ });
const [previewData, setPreviewData] = useState({ /* calculations */ });
const [invoice, setInvoice] = useState(null); // Final transaction

## 2. Real-time Data Synchronization

**Problem:** Keeping cached data fresh while maintaining performance  

**Solution:** Hybrid caching strategy:

// Cache with periodic refresh
useEffect(() => {
  pollingIntervalRef.current = setInterval(() => {
    fetchData(false); // Background refresh
  }, POLLING_INTERVAL);
  
  return () => clearInterval(pollingIntervalRef.current);
}, [fetchData]);

Here’s your section properly formatted as a Markdown (.md) file:

## 3. Dynamic Receipt Generation

**Problem:** Generating consistent receipts without storage  

**Solution:** Backend data mapping pattern:

private ServiceInvoiceDto buildInvoice(Transaction tx) {
    // Map transaction data to receipt format
    // Calculate consumable totals dynamically
    // Apply formatting settings
    return new ServiceInvoiceDto(/* mapped data */);
}

## 4. Form Validation Complexity

**Problem:** Multiple validation rules across different payment methods  

**Solution:** Conditional validation pipeline:

const handleSubmit = async (e) => {
  // Name validation (no numbers)
  const nameHasNumbers = /[0-9]/.test(form.name);
  
  // Contact validation (PH format)
  const isValidContact = /^09\d{9}$/.test(form.contact);
  
  // GCash-specific validation
  if (form.paymentMethod === "GCash") {
    if (!/^\d+$/.test(form.gcashReference)) {
      // GCash reference validation
    }
  }
};


# 🔧 Technical Implementation Details

## Cache Strategy

const initializeCache = () => {
  try {
    const stored = localStorage.getItem('transactionFormCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed; // Use valid cache
      }
    }
  } catch (error) {
    console.warn('Cache load failed:', error);
  }
  return null;
};


## Print Functionality

useEffect(() => {
  const handlePrintStart = () => document.body.classList.add("print-mode");
  const handlePrintEnd = () => {
    document.body.classList.remove("print-mode");
    setShowActions(true);
  };

  window.addEventListener("beforeprint", handlePrintStart);
  window.addEventListener("afterprint", handlePrintEnd);

  return () => {
    window.removeEventListener("beforeprint", handlePrintStart);
    window.removeEventListener("afterprint", handlePrintEnd);
  };
}, []);

## QR Code Integration

Dynamic QR code generation for laundry tracking
const trackingId = invoiceNumber || transactionId;
const qrValue = trackingId 
  ? `https://starwashph.com/home?search=${encodeURIComponent(trackingId)}#service_tracking`
  : null;


# 🚀 Performance Optimizations

- **Caching:** 30-minute cache with 1-minute polling  
- **Lazy Loading:** Components load data only when needed  
- **Memoization:** Prevent unnecessary re-renders  
- **Batch Updates:** Multiple state updates in single render cycle  

# 📝 Key Learnings

- **State Management:** Learned to manage complex state relationships  
- **Caching Strategies:** Implemented efficient client-side caching  
- **Dynamic Generation:** Mastered generating content from existing data  
- **Form Validation:** Created robust validation for different scenarios  
- **Print Optimization:** Learned browser print event handling  

---