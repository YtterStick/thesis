package com.starwash.authservice.service;

import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.MachineItem;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.MachineRepository;
import com.starwash.authservice.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

        private final TransactionRepository transactionRepository;
        private final LaundryJobRepository laundryJobRepository;
        private final MachineRepository machineRepository;

        public DashboardService(TransactionRepository transactionRepository,
                        LaundryJobRepository laundryJobRepository,
                        MachineRepository machineRepository) {
                this.transactionRepository = transactionRepository;
                this.laundryJobRepository = laundryJobRepository;
                this.machineRepository = machineRepository;
        }

        public Map<String, Object> getStaffDashboardData() {
                Map<String, Object> data = new HashMap<>();

                LocalDate today = LocalDate.now();
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

                List<Transaction> todayTransactions = transactionRepository.findByCreatedAtBetween(startOfDay,
                                endOfDay);

                double todayIncome = todayTransactions.stream()
                                .mapToDouble(Transaction::getTotalPrice)
                                .sum();

                int todayLoads = todayTransactions.stream()
                                .mapToInt(Transaction::getServiceQuantity)
                                .sum();

                int unwashedCount = (int) laundryJobRepository.findAll().stream()
                                .filter(job -> job.getLoadAssignments() != null)
                                .flatMap(job -> job.getLoadAssignments().stream())
                                .filter(load -> !"COMPLETED".equalsIgnoreCase(load.getStatus()))
                                .count();

                List<LaundryJob> completedUnclaimedJobs = laundryJobRepository.findAll().stream()
                                .filter(job -> job.getLoadAssignments() != null &&
                                                job.getLoadAssignments().stream()
                                                                .allMatch(load -> "COMPLETED"
                                                                                .equalsIgnoreCase(load.getStatus())))
                                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                                .filter(job -> !job.isExpired())
                                .collect(Collectors.toList());

                int unclaimedCount = completedUnclaimedJobs.size();

                List<MachineItem> allMachines = machineRepository.findAll();

                data.put("todayIncome", todayIncome);
                data.put("todayLoads", todayLoads);
                data.put("unwashedCount", unwashedCount);
                data.put("unclaimedCount", unclaimedCount);
                data.put("allMachines", allMachines);
                data.put("completedUnclaimedTransactions", completedUnclaimedJobs);

                return data;
        }

        public Map<String, Object> getAdminDashboardData() {
                Map<String, Object> data = new HashMap<>();

                List<Transaction> allTransactions = transactionRepository.findAll();

                double totalIncome = allTransactions.stream()
                                .mapToDouble(Transaction::getTotalPrice)
                                .sum();

                int totalLoads = allTransactions.stream()
                                .mapToInt(Transaction::getServiceQuantity)
                                .sum();

                int unwashedCount = (int) laundryJobRepository.findAll().stream()
                                .filter(job -> job.getLoadAssignments() != null)
                                .flatMap(job -> job.getLoadAssignments().stream())
                                .filter(load -> !"COMPLETED".equalsIgnoreCase(load.getStatus()))
                                .count();

                List<LaundryJob> allUnclaimedJobs = laundryJobRepository.findAll().stream()
                                .filter(job -> job.getLoadAssignments() != null &&
                                                job.getLoadAssignments().stream()
                                                                .allMatch(load -> "COMPLETED"
                                                                                .equalsIgnoreCase(load.getStatus())))
                                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                                .collect(Collectors.toList());

                int totalUnclaimed = allUnclaimedJobs.size();

                int currentYear = LocalDate.now().getYear();
                LocalDate startOfYear = LocalDate.of(currentYear, 1, 1);
                LocalDate endOfYear = LocalDate.of(currentYear, 12, 31);

                Map<String, Double> monthlyIncome = new LinkedHashMap<>();

                String[] monthNames = { "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
                for (String month : monthNames) {
                        monthlyIncome.put(month, 0.0);
                }

                allTransactions.stream()
                                .filter(tx -> {
                                        LocalDate txDate = tx.getCreatedAt().toLocalDate();
                                        return !txDate.isBefore(startOfYear) && !txDate.isAfter(endOfYear);
                                })
                                .forEach(tx -> {
                                        int month = tx.getCreatedAt().getMonthValue();
                                        String monthName = monthNames[month - 1];
                                        monthlyIncome.put(monthName, monthlyIncome.get(monthName) + tx.getTotalPrice());
                                });

                List<Map<String, Object>> overviewData = monthlyIncome.entrySet().stream()
                                .map(entry -> {
                                        Map<String, Object> monthData = new HashMap<>();
                                        monthData.put("name", entry.getKey());
                                        monthData.put("total", entry.getValue());
                                        return monthData;
                                })
                                .collect(Collectors.toList());

                List<Map<String, Object>> unclaimedList = allUnclaimedJobs.stream()
                                .map(job -> {
                                        Map<String, Object> item = new HashMap<>();
                                        item.put("id", job.getId());
                                        item.put("customerName", job.getCustomerName());
                                        item.put("serviceType", job.getServiceType());

                                        int loadCount = job.getLoadAssignments() != null
                                                        ? job.getLoadAssignments().size()
                                                        : 0;
                                        item.put("loadCount", loadCount);

                                        if (job.getDueDate() != null) {
                                                item.put("date",
                                                                job.getDueDate().format(
                                                                                java.time.format.DateTimeFormatter
                                                                                                .ofPattern("MMM dd, yyyy")));
                                        } else {
                                                Optional<Transaction> transaction = transactionRepository
                                                                .findByInvoiceNumber(job.getTransactionId());
                                                if (transaction.isPresent()
                                                                && transaction.get().getCreatedAt() != null) {
                                                        item.put("date", transaction.get().getCreatedAt()
                                                                        .format(java.time.format.DateTimeFormatter
                                                                                        .ofPattern("MMM dd, yyyy")));
                                                } else {
                                                        item.put("date", "N/A");
                                                }
                                        }

                                        return item;
                                })
                                .collect(Collectors.toList());

                data.put("totalIncome", totalIncome);
                data.put("totalLoads", totalLoads);
                data.put("unwashedCount", unwashedCount);
                data.put("totalUnclaimed", totalUnclaimed);
                data.put("overviewData", overviewData);
                data.put("unclaimedList", unclaimedList);

                return data;
        }

        private double getTransactionAmount(String transactionId) {
                return transactionRepository.findByInvoiceNumber(transactionId)
                                .map(Transaction::getTotalPrice)
                                .orElse(0.0);
        }
}