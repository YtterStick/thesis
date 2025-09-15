package com.starwash.authservice.service;

import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.repository.TransactionRepository;
import com.starwash.authservice.repository.LaundryJobRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final LaundryJobRepository laundryJobRepository;

    public ReportService(TransactionRepository transactionRepository, 
                         LaundryJobRepository laundryJobRepository) {
        this.transactionRepository = transactionRepository;
        this.laundryJobRepository = laundryJobRepository;
    }

    public Map<String, Object> generateSalesReport(String dateRange, LocalDate startDate, LocalDate endDate,
            String serviceType) {
        Map<String, Object> reportData = new HashMap<>();

        // Determine date range
        LocalDate[] dates = calculateDateRange(dateRange, startDate, endDate);
        LocalDate reportStartDate = dates[0];
        LocalDate reportEndDate = dates[1];

        // Fetch transactions
        List<Transaction> transactions = transactionRepository.findByCreatedAtBetween(
                reportStartDate.atStartOfDay(),
                reportEndDate.plusDays(1).atStartOfDay());

        // Filter by service type if specified
        if (serviceType != null && !"all".equals(serviceType)) {
            transactions = transactions.stream()
                    .filter(t -> serviceType.equals(t.getServiceName()))
                    .collect(Collectors.toList());
        }

        // Generate sales trend data
        List<Map<String, Object>> salesTrend = generateSalesTrend(transactions, reportStartDate, reportEndDate);

        // Generate service distribution data
        List<Map<String, Object>> serviceDistribution = generateServiceDistribution(transactions);

        // Generate summary data
        Map<String, Object> summary = generateSummary(transactions, reportStartDate, reportEndDate);

        // Get unique customer transactions (latest per customer)
        List<Map<String, Object>> uniqueCustomerTransactions = getUniqueCustomerTransactions(transactions);

        reportData.put("salesTrend", salesTrend);
        reportData.put("serviceDistribution", serviceDistribution);
        reportData.put("summary", summary);
        reportData.put("recentTransactions", uniqueCustomerTransactions);

        return reportData;
    }

    private LocalDate[] calculateDateRange(String dateRange, LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();

        if ("custom".equals(dateRange) && startDate != null && endDate != null) {
            return new LocalDate[] { startDate, endDate };
        }

        switch (dateRange) {
            case "today":
                return new LocalDate[] { today, today };
            case "yesterday":
                LocalDate yesterday = today.minusDays(1);
                return new LocalDate[] { yesterday, yesterday };
            case "week":
                LocalDate weekStart = today.minusDays(7);
                return new LocalDate[] { weekStart, today };
            case "month":
                LocalDate monthStart = today.withDayOfMonth(1);
                return new LocalDate[] { monthStart, today };
            default:
                return new LocalDate[] { today.minusDays(30), today };
        }
    }

    private List<Map<String, Object>> generateSalesTrend(List<Transaction> transactions, LocalDate startDate,
            LocalDate endDate) {
        Map<String, Double> dailySales = new LinkedHashMap<>();

        // Initialize with zeros for all dates in range
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            dailySales.put(currentDate.format(DateTimeFormatter.ofPattern("MMM dd")), 0.0);
            currentDate = currentDate.plusDays(1);
        }

        // Fill with actual data
        transactions.forEach(transaction -> {
            String dateKey = transaction.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("MMM dd"));
            double currentTotal = dailySales.getOrDefault(dateKey, 0.0);
            dailySales.put(dateKey, currentTotal + transaction.getTotalPrice());
        });

        // Convert to list of maps
        return dailySales.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> dataPoint = new HashMap<>();
                    dataPoint.put("period", entry.getKey());
                    dataPoint.put("sales", entry.getValue());
                    return dataPoint;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> generateServiceDistribution(List<Transaction> transactions) {
        Map<String, Long> serviceCounts = transactions.stream()
                .collect(Collectors.groupingBy(
                        Transaction::getServiceName,
                        Collectors.counting()));

        return serviceCounts.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> dataPoint = new HashMap<>();
                    dataPoint.put("name", entry.getKey());
                    dataPoint.put("value", entry.getValue());
                    return dataPoint;
                })
                .collect(Collectors.toList());
    }

   private Map<String, Object> generateSummary(List<Transaction> transactions, LocalDate startDate,
        LocalDate endDate) {
    Map<String, Object> summary = new HashMap<>();

    // Calculate totals
    double totalSales = transactions.stream()
            .mapToDouble(Transaction::getTotalPrice)
            .sum();

    long totalTransactions = transactions.size();
    
    // Calculate total loads (sum of serviceQuantity from all transactions)
    long totalLoads = transactions.stream()
            .mapToLong(Transaction::getServiceQuantity)
            .sum();

    long totalCustomers = transactions.stream()
            .map(Transaction::getCustomerName)
            .distinct()
            .count();

    // Fix average order value calculation - total sales divided by number of transactions
    double averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Get previous period for comparison
    long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
    LocalDate previousStartDate = startDate.minusDays(daysBetween);
    LocalDate previousEndDate = endDate.minusDays(daysBetween);

    List<Transaction> previousTransactions = transactionRepository.findByCreatedAtBetween(
            previousStartDate.atStartOfDay(),
            previousEndDate.plusDays(1).atStartOfDay());

    double previousSales = previousTransactions.stream()
            .mapToDouble(Transaction::getTotalPrice)
            .sum();

    double growthPercentage = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0;

    summary.put("totalSales", totalSales);
    summary.put("totalTransactions", totalTransactions);
    summary.put("totalLoads", totalLoads); // Add total loads to summary
    summary.put("totalCustomers", totalCustomers);
    summary.put("averageOrderValue", averageOrderValue);
    summary.put("todaySales", totalSales);
    summary.put("yesterdaySales", previousSales);
    summary.put("growthPercentage", growthPercentage);

    return summary;
}

    private List<Map<String, Object>> getUniqueCustomerTransactions(List<Transaction> transactions) {
        // Group transactions by customer name and get the latest transaction for each
        Map<String, Transaction> latestTransactionsByCustomer = transactions.stream()
            .collect(Collectors.toMap(
                Transaction::getCustomerName,
                Function.identity(),
                (existing, replacement) -> 
                    replacement.getCreatedAt().isAfter(existing.getCreatedAt()) ? replacement : existing
            ));

        // Fetch laundry jobs for all transactions
        List<String> transactionIds = latestTransactionsByCustomer.values().stream()
            .map(Transaction::getId)
            .collect(Collectors.toList());

        List<LaundryJob> laundryJobs = laundryJobRepository.findByTransactionIdIn(transactionIds);
        Map<String, LaundryJob> laundryJobMap = laundryJobs.stream()
            .collect(Collectors.toMap(LaundryJob::getTransactionId, Function.identity()));

        // Convert to list and sort by date descending
        return latestTransactionsByCustomer.values().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .map(transaction -> {
                Map<String, Object> transactionData = new HashMap<>();
                transactionData.put("id", transaction.getId());
                transactionData.put("customerName", transaction.getCustomerName());
                transactionData.put("serviceType", transaction.getServiceName());
                transactionData.put("totalPrice", transaction.getTotalPrice());
                transactionData.put("createdAt", transaction.getCreatedAt());
                
                // Get status from LaundryJob instead of Transaction
                LaundryJob job = laundryJobMap.get(transaction.getId());
                String status = (job != null) ? job.getPickupStatus() : "UNKNOWN";
                transactionData.put("status", status);
                
                return transactionData;
            })
            .collect(Collectors.toList());
    }
}