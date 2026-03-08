package com.starwash.authservice.service;

import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.MachineItem;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.MachineRepository;
import com.starwash.authservice.repository.TransactionRepository;
import org.springframework.data.domain.Pageable;
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

        // NEW: Get dashboard totals without pagination
        public Map<String, Object> getAdminDashboardTotals() {
                Map<String, Object> data = new HashMap<>();

                // Calculate totals using optimized repository aggregations
                Double totalIncome = transactionRepository.sumTotalPrice();
                Integer totalLoads = transactionRepository.sumServiceQuantity();

                // Use targeted fetch instead of fetching all laundry jobs for unwashedCount
                List<LaundryJob> incompleteJobs = laundryJobRepository.findIncompleteJobs();
                int unwashedLoads = (int) incompleteJobs.stream()
                                .filter(job -> job.getLoadAssignments() != null)
                                .flatMap(job -> job.getLoadAssignments().stream())
                                .filter(load -> !"COMPLETED".equalsIgnoreCase(load.getStatus()))
                                .count();

                long totalUnclaimed = laundryJobRepository
                                .countByPickupStatusAndExpiredFalseAndDisposedFalse("UNCLAIMED");

                // Get today's metrics
                LocalDate today = LocalDate.now();
                LocalDateTime startOfDay = today.atStartOfDay();

                // Calculate pending count (transactions today that aren't fully claimed)
                List<Transaction> todayTransactions = transactionRepository.findByCreatedAtAfter(startOfDay);

                int pendingCount = (int) todayTransactions.stream()
                                .filter(tx -> {
                                        Optional<LaundryJob> jobOpt = laundryJobRepository
                                                        .findFirstByTransactionId(tx.getInvoiceNumber());
                                        if (jobOpt.isPresent()) {
                                                LaundryJob job = jobOpt.get();
                                                boolean isCompleted = job.getLoadAssignments() != null &&
                                                                job.getLoadAssignments().stream()
                                                                                .allMatch(load -> "COMPLETED"
                                                                                                .equalsIgnoreCase(load
                                                                                                                .getStatus()));
                                                boolean isClaimed = "CLAIMED".equalsIgnoreCase(job.getPickupStatus());
                                                return !isCompleted || !isClaimed;
                                        }
                                        return true;
                                })
                                .count();

                data.put("totalIncome", totalIncome != null ? totalIncome : 0.0);
                data.put("totalLoads", totalLoads != null ? totalLoads : 0);
                data.put("unwashedCount", unwashedLoads);
                data.put("totalUnclaimed", (int) totalUnclaimed);
                data.put("pendingCount", pendingCount);

                return data;
        }

        public Map<String, Object> getStaffDashboardData() {
                Map<String, Object> data = new HashMap<>();

                LocalDate today = LocalDate.now();
                LocalDateTime startOfDay = today.atStartOfDay();

                Double todayIncome = transactionRepository.sumTotalPriceByCreatedAtAfter(startOfDay);
                Integer todayLoads = transactionRepository.sumServiceQuantityByCreatedAtAfter(startOfDay);

                // Optimize unwashedCount fetch
                List<LaundryJob> incompleteJobs = laundryJobRepository.findIncompleteJobs();
                int unwashedCount = (int) incompleteJobs.stream()
                                .filter(job -> job.getLoadAssignments() != null)
                                .flatMap(job -> job.getLoadAssignments().stream())
                                .filter(load -> !"COMPLETED".equalsIgnoreCase(load.getStatus()))
                                .count();

                // Optimized unclaimedCount
                long unclaimedCount = laundryJobRepository
                                .countByPickupStatusAndExpiredFalseAndDisposedFalse("UNCLAIMED");

                List<MachineItem> allMachines = machineRepository.findAll();

                List<Map<String, Object>> enhancedMachines = allMachines.stream()
                                .map(machine -> {
                                        Map<String, Object> machineData = new HashMap<>();
                                        machineData.put("id", machine.getId());
                                        machineData.put("name", machine.getName());
                                        machineData.put("type", machine.getType());
                                        machineData.put("capacityKg", machine.getCapacityKg());
                                        machineData.put("status", machine.getStatus());
                                        machineData.put("lastMaintenance", machine.getLastMaintenance());
                                        machineData.put("nextMaintenance", machine.getNextMaintenance());

                                        return machineData;
                                })
                                .collect(Collectors.toList());

                // Optimized fetch for completed unclaimed jobs
                List<LaundryJob> completedUnclaimedJobs = laundryJobRepository
                                .findByPickupStatusAndExpiredAndDisposed("UNCLAIMED", false, false, Pageable.unpaged())
                                .getContent().stream()
                                .filter(job -> job.getLoadAssignments() != null &&
                                                job.getLoadAssignments().stream()
                                                                .allMatch(load -> "COMPLETED"
                                                                                .equalsIgnoreCase(load.getStatus())))
                                .collect(Collectors.toList());

                data.put("todayIncome", todayIncome != null ? todayIncome : 0.0);
                data.put("todayLoads", todayLoads != null ? todayLoads : 0);
                data.put("unwashedCount", unwashedCount);
                data.put("unclaimedCount", (int) unclaimedCount);
                data.put("allMachines", enhancedMachines);
                data.put("completedUnclaimedTransactions", completedUnclaimedJobs);

                return data;
        }

        public Map<String, Object> getAdminDashboardData() {
                Map<String, Object> data = new HashMap<>();

                // Use the new totals method for main metrics
                Map<String, Object> totals = getAdminDashboardTotals();
                data.putAll(totals);

                // Keep the existing chart data logic
                int currentYear = LocalDate.now().getYear();
                LocalDate startOfYear = LocalDate.of(currentYear, 1, 1);
                LocalDate endOfYear = LocalDate.of(currentYear, 12, 31);

                List<Transaction> allTransactions = transactionRepository.findAll();

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

                // Get unclaimed list
                List<LaundryJob> allUnclaimedJobs = laundryJobRepository.findAll().stream()
                                .filter(job -> job.getLoadAssignments() != null &&
                                                job.getLoadAssignments().stream()
                                                                .allMatch(load -> "COMPLETED"
                                                                                .equalsIgnoreCase(load.getStatus())))
                                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
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
                                                item.put("date", job.getDueDate().format(
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