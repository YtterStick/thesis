package com.starwash.authservice.service;

import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final TransactionRepository transactionRepository;

    public ReportService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public Map<String, Object> generateSalesReport(String dateRange, LocalDate startDate, LocalDate endDate,
            String serviceType) {
        Map<String, Object> reportData = new HashMap<>();

        LocalDate[] dates = calculateDateRange(dateRange, startDate, endDate);
        LocalDate reportStartDate = dates[0];
        LocalDate reportEndDate = dates[1];

        List<Transaction> transactions = transactionRepository.findByCreatedAtBetween(
                reportStartDate.atStartOfDay(),
                reportEndDate.plusDays(1).atStartOfDay());

        if (serviceType != null && !"all".equals(serviceType)) {
            transactions = transactions.stream()
                    .filter(t -> serviceType.equals(t.getServiceName()))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> salesTrend = generateSalesTrend(transactions, reportStartDate, reportEndDate);

        List<Map<String, Object>> serviceDistribution = generateServiceDistribution(transactions);

        Map<String, Object> summary = generateSummary(transactions, reportStartDate, reportEndDate);

        List<Map<String, Object>> uniqueCustomerTransactions = getUniqueCustomerTransactions(transactions);

        reportData.put("salesTrend", salesTrend);
        reportData.put("serviceDistribution", serviceDistribution);
        reportData.put("summary", summary);
        reportData.put("recentTransactions", uniqueCustomerTransactions);

        return reportData;
    }

    private LocalDate[] calculateDateRange(String dateRange, LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();

        if ("custom".equals(dateRange)) {
            if (startDate == null || endDate == null) {
                throw new IllegalArgumentException("Both start date and end date are required for custom range");
            }

            if (startDate.isAfter(endDate)) {
                return new LocalDate[] { endDate, startDate };
            }
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

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            dailySales.put(currentDate.format(DateTimeFormatter.ofPattern("MMM dd")), 0.0);
            currentDate = currentDate.plusDays(1);
        }

        transactions.forEach(transaction -> {
            String dateKey = transaction.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("MMM dd"));
            double currentTotal = dailySales.getOrDefault(dateKey, 0.0);
            dailySales.put(dateKey, currentTotal + transaction.getTotalPrice());
        });

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
        double totalSales = transactions.stream()
                .mapToDouble(Transaction::getTotalPrice)
                .sum();

        long totalTransactions = transactions.size();

        long totalLoads = transactions.stream()
                .mapToLong(Transaction::getServiceQuantity)
                .sum();

        long totalCustomers = transactions.stream()
                .map(Transaction::getCustomerName)
                .distinct()
                .count();

        double averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

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
        summary.put("totalLoads", totalLoads);
        summary.put("totalCustomers", totalCustomers);
        summary.put("averageOrderValue", averageOrderValue);
        summary.put("todaySales", totalSales);
        summary.put("yesterdaySales", previousSales);
        summary.put("growthPercentage", growthPercentage);

        return summary;
    }

    private List<Map<String, Object>> getUniqueCustomerTransactions(List<Transaction> transactions) {
        Map<String, Transaction> latestTransactionsByCustomer = transactions.stream()
                .collect(Collectors.toMap(
                        Transaction::getCustomerName,
                        Function.identity(),
                        (existing, replacement) -> replacement.getCreatedAt().isAfter(existing.getCreatedAt())
                                ? replacement
                                : existing));

        return latestTransactionsByCustomer.values().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(transaction -> {
                    Map<String, Object> transactionData = new HashMap<>();
                    transactionData.put("id", transaction.getId());
                    transactionData.put("customerName", transaction.getCustomerName());
                    transactionData.put("serviceType", transaction.getServiceName());
                    transactionData.put("totalPrice", transaction.getTotalPrice());
                    transactionData.put("createdAt", transaction.getCreatedAt());
                    return transactionData;
                })
                .collect(Collectors.toList());
    }
}