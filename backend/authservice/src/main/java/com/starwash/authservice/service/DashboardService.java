package com.starwash.authservice.service;

import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.MachineRepository;
import com.starwash.authservice.repository.TransactionRepository;
import com.starwash.authservice.model.MachineItem;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        
        // Today's date
        LocalDate today = LocalDate.now();
        
        // Today's income
        List<Transaction> todayTransactions = transactionRepository.findByCreatedAtBetween(
            today.atStartOfDay(),
            today.atTime(23, 59, 59)
        );
        double todayIncome = todayTransactions.stream()
            .mapToDouble(Transaction::getTotalPrice)
            .sum();
        
        // Today's loads
        long todayLoads = todayTransactions.stream()
            .mapToInt(Transaction::getServiceQuantity)
            .sum();
        
        // Unwashed count (jobs that are not completed)
        long unwashedCount = laundryJobRepository.findAll().stream()
            .filter(job -> job.getLoadAssignments() != null)
            .filter(job -> job.getLoadAssignments().stream()
                .anyMatch(load -> !"COMPLETED".equalsIgnoreCase(load.getStatus())))
            .count();
        
        // Get COMPLETED unclaimed transactions (same as claiming page)
        List<Map<String, Object>> completedUnclaimedTransactions = laundryJobRepository.findByPickupStatus("UNCLAIMED").stream()
            .filter(job -> {
                // Filter for jobs where ALL loads are completed
                if (job.getLoadAssignments() == null) return false;
                return job.getLoadAssignments().stream()
                    .allMatch(load -> "COMPLETED".equalsIgnoreCase(load.getStatus()));
            })
            .map(job -> {
                Map<String, Object> txData = new HashMap<>();
                txData.put("id", job.getId());
                txData.put("customerName", job.getCustomerName());
                txData.put("serviceType", job.getServiceType());
                txData.put("loadAssignments", job.getLoadAssignments());
                // Add contact if available
                if (job.getContact() != null) {
                    txData.put("contact", job.getContact());
                }
                return txData;
            })
            .collect(Collectors.toList());
        
        // Get ALL machines with their details
        List<Map<String, Object>> allMachines = machineRepository.findAll().stream()
            .map(machine -> {
                Map<String, Object> machineData = new HashMap<>();
                machineData.put("id", machine.getId());
                machineData.put("name", machine.getName());
                machineData.put("type", machine.getType());
                machineData.put("status", machine.getStatus());
                
                // Find if this machine is currently in use by any load
                LocalDateTime endTime = findMachineEndTime(machine.getId());
                if (endTime != null) {
                    machineData.put("endTime", endTime.toString());
                }
                
                return machineData;
            })
            .collect(Collectors.toList());
        
        data.put("todayIncome", todayIncome);
        data.put("todayLoads", todayLoads);
        data.put("unwashedCount", unwashedCount);
        data.put("unclaimedCount", completedUnclaimedTransactions.size()); // Count of completed unclaimed
        data.put("allMachines", allMachines);
        data.put("completedUnclaimedTransactions", completedUnclaimedTransactions); // Changed from unclaimedTransactions
        
        return data;
    }

    private LocalDateTime findMachineEndTime(String machineId) {
        // Find all laundry jobs that might be using this machine
        List<LaundryJob> jobs = laundryJobRepository.findAll();
        
        for (LaundryJob job : jobs) {
            if (job.getLoadAssignments() != null) {
                for (LaundryJob.LoadAssignment load : job.getLoadAssignments()) {
                    if (machineId.equals(load.getMachineId()) && 
                        load.getEndTime() != null && 
                        load.getEndTime().isAfter(LocalDateTime.now())) {
                        return load.getEndTime();
                    }
                }
            }
        }
        return null;
    }

    // Helper method to get active machines count by type
    public Map<String, Long> getActiveMachinesCount() {
        List<MachineItem> allMachines = machineRepository.findAll();
        
        long activeWashers = allMachines.stream()
            .filter(machine -> "WASHER".equalsIgnoreCase(machine.getType()))
            .filter(machine -> "In Use".equalsIgnoreCase(machine.getStatus()))
            .count();
            
        long activeDryers = allMachines.stream()
            .filter(machine -> "DRYER".equalsIgnoreCase(machine.getType()))
            .filter(machine -> "In Use".equalsIgnoreCase(machine.getStatus()))
            .count();
            
        Map<String, Long> counts = new HashMap<>();
        counts.put("activeWashers", activeWashers);
        counts.put("activeDryers", activeDryers);
        
        return counts;
    }

    // Helper method to get machines that will finish soon (within 5 minutes)
    public List<Map<String, Object>> getMachinesFinishingSoon() {
        return machineRepository.findAll().stream()
            .map(machine -> {
                Map<String, Object> machineInfo = findMachineUsageInfo(machine.getId());
                if (machineInfo != null && machineInfo.containsKey("endTime")) {
                    LocalDateTime endTime = LocalDateTime.parse((String) machineInfo.get("endTime"));
                    LocalDateTime now = LocalDateTime.now();
                    
                    if (endTime.isAfter(now) && endTime.isBefore(now.plusMinutes(5))) {
                        Map<String, Object> finishingMachine = new HashMap<>();
                        finishingMachine.put("id", machine.getId());
                        finishingMachine.put("name", machine.getName());
                        finishingMachine.put("type", machine.getType());
                        finishingMachine.put("endTime", machineInfo.get("endTime"));
                        finishingMachine.put("customer", machineInfo.get("customer"));
                        finishingMachine.put("loadNumber", machineInfo.get("loadNumber"));
                        return finishingMachine;
                    }
                }
                return null;
            })
            .filter(machine -> machine != null)
            .collect(Collectors.toList());
    }

    private Map<String, Object> findMachineUsageInfo(String machineId) {
        // Find all laundry jobs that might be using this machine
        List<LaundryJob> jobs = laundryJobRepository.findAll();
        
        for (LaundryJob job : jobs) {
            if (job.getLoadAssignments() != null) {
                for (LaundryJob.LoadAssignment load : job.getLoadAssignments()) {
                    if (machineId.equals(load.getMachineId()) && 
                        load.getEndTime() != null) {
                        
                        Map<String, Object> usageInfo = new HashMap<>();
                        usageInfo.put("endTime", load.getEndTime().toString());
                        
                        // Add customer info for context
                        if (job.getCustomerName() != null) {
                            usageInfo.put("customer", job.getCustomerName());
                        }
                        
                        // Add load number for context
                        usageInfo.put("loadNumber", load.getLoadNumber());
                        
                        return usageInfo;
                    }
                }
            }
        }
        return null;
    }
}