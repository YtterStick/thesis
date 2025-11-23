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

    // NEW: Get dashboard totals without pagination
    public Map<String, Object> getAdminDashboardTotals() {
        Map<String, Object> data = new HashMap<>();

        // Get ALL transactions without pagination for totals
        List<Transaction> allTransactions = transactionRepository.findAll();

        // Calculate totals from ALL records
        double totalIncome = allTransactions.stream()
                .mapToDouble(Transaction::getTotalPrice)
                .sum();

        int totalLoads = allTransactions.stream()
                .mapToInt(Transaction::getServiceQuantity)
                .sum();

        // Calculate other metrics from ALL laundry jobs
        List<LaundryJob> allLaundryJobs = laundryJobRepository.findAll();
        
        int unwashedCount = (int) allLaundryJobs.stream()
                .filter(job -> job.getLoadAssignments() != null)
                .flatMap(job -> job.getLoadAssignments().stream())
                .filter(load -> !"COMPLETED".equalsIgnoreCase(load.getStatus()))
                .count();

        List<LaundryJob> allUnclaimedJobs = allLaundryJobs.stream()
                .filter(job -> job.getLoadAssignments() != null &&
                        job.getLoadAssignments().stream()
                                .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                .filter(job -> !job.isExpired() && !job.isDisposed())
                .collect(Collectors.toList());

        int totalUnclaimed = allUnclaimedJobs.size();

        // Get today's pending count
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        
        List<Transaction> todayTransactions = transactionRepository.findByCreatedAtBetween(startOfDay, endOfDay);
        
        // Calculate pending count (transactions not completed and not claimed)
        int pendingCount = (int) todayTransactions.stream()
                .filter(tx -> {
                    // Find corresponding laundry job
                    Optional<LaundryJob> jobOpt = allLaundryJobs.stream()
                            .filter(j -> tx.getInvoiceNumber().equals(j.getTransactionId()))
                            .findFirst();
                    
                    if (jobOpt.isPresent()) {
                        LaundryJob job = jobOpt.get();
                        // Pending if not completed or not claimed
                        boolean isCompleted = job.getLoadAssignments() != null &&
                                job.getLoadAssignments().stream()
                                        .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus()));
                        boolean isClaimed = "CLAIMED".equalsIgnoreCase(job.getPickupStatus());
                        return !isCompleted || !isClaimed;
                    }
                    return true; // If no job found, consider it pending
                })
                .count();

        data.put("totalIncome", totalIncome);
        data.put("totalLoads", totalLoads);
        data.put("unwashedCount", unwashedCount);
        data.put("totalUnclaimed", totalUnclaimed);
        data.put("pendingCount", pendingCount);

        System.out.println("💰 Dashboard Totals Calculated:");
        System.out.println("   - Total Income: ₱" + totalIncome);
        System.out.println("   - Total Loads: " + totalLoads);
        System.out.println("   - Unwashed Count: " + unwashedCount);
        System.out.println("   - Total Unclaimed: " + totalUnclaimed);
        System.out.println("   - Pending Count: " + pendingCount);

        return data;
    }

    public Map<String, Object> getStaffDashboardData() {
        Map<String, Object> data = new HashMap<>();

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        List<Transaction> todayTransactions = transactionRepository.findByCreatedAtBetween(startOfDay, endOfDay);

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
                                .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
                .filter(job -> "UNCLAIMED".equalsIgnoreCase(job.getPickupStatus()))
                .filter(job -> !job.isExpired())
                .collect(Collectors.toList());

        int unclaimedCount = completedUnclaimedJobs.size();

        List<MachineItem> allMachines = machineRepository.findAll();

        Map<String, LocalDateTime> machineEndTimes = new HashMap<>();
        laundryJobRepository.findAll().stream()
                .filter(job -> job.getLoadAssignments() != null)
                .flatMap(job -> job.getLoadAssignments().stream())
                .filter(load -> load.getMachineId() != null && 
                        ("WASHING".equals(load.getStatus()) || "DRYING".equals(load.getStatus())))
                .forEach(load -> machineEndTimes.put(load.getMachineId(), load.getEndTime()));

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
                    
                    if ("In Use".equals(machine.getStatus()) && machineEndTimes.containsKey(machine.getId())) {
                        machineData.put("endTime", machineEndTimes.get(machine.getId()));
                    }
                    
                    return machineData;
                })
                .collect(Collectors.toList());

        data.put("todayIncome", todayIncome);
        data.put("todayLoads", todayLoads);
        data.put("unwashedCount", unwashedCount);
        data.put("unclaimedCount", unclaimedCount);
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
                                .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus())))
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
                                java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
                    } else {
                        Optional<Transaction> transaction = transactionRepository
                                .findByInvoiceNumber(job.getTransactionId());
                        if (transaction.isPresent() && transaction.get().getCreatedAt() != null) {
                            item.put("date", transaction.get().getCreatedAt()
                                    .format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy")));
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