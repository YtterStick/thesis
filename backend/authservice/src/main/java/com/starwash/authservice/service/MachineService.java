package com.starwash.authservice.service;

import com.starwash.authservice.model.MachineItem;
import com.starwash.authservice.repository.MachineRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MachineService {
    
    private final MachineRepository machineRepository;
    
    public MachineService(MachineRepository machineRepository) {
        this.machineRepository = machineRepository;
    }
    
    /**
     * Calculate number of loads needed based on total weight and machine type
     */
    public LoadCalculationResult calculateLoads(double totalWeightKg, String machineType) {
        // Get all machines of the specified type
        List<MachineItem> machines = machineRepository.findByType(machineType);
        
        if (machines.isEmpty()) {
            // Fallback: try to find any machine if specified type not found
            machines = machineRepository.findAll();
            if (machines.isEmpty()) {
                throw new RuntimeException("No machines found");
            }
            System.out.println("⚠️ No " + machineType + " machines found, using any available machine");
        }
        
        // Find the machine with highest capacity
        Optional<MachineItem> highestCapacityMachine = machines.stream()
                .max(Comparator.comparing(machine -> 
                    machine.getCapacityKg() != null ? machine.getCapacityKg() : 0.0));
        
        MachineItem machine = highestCapacityMachine.orElse(machines.get(0));
        double capacityKg = machine.getCapacityKg() != null ? machine.getCapacityKg() : 8.0;
        
        // Group machines by capacity for the specified type
        List<Double> uniqueCapacities = machines.stream()
                .map(m -> m.getCapacityKg() != null ? m.getCapacityKg() : 8.0)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        
        // Calculate number of loads needed (round up)
        int loadsNeeded = (int) Math.ceil(totalWeightKg / capacityKg);
        
        // Calculate plastic needed (typically 1 plastic per load)
        int plasticNeeded = loadsNeeded;
        
        String machineInfo;
        if (uniqueCapacities.size() == 1) {
            // All machines have same capacity
            double capacity = uniqueCapacities.get(0);
            machineInfo = getMachineDisplayName(capacity) + " - " + capacity + "kg";
        } else {
            // Multiple different capacities
            StringBuilder infoBuilder = new StringBuilder();
            
            // Use "Machine" for the highest capacity, specific names for others
            if (capacityKg > 8.0) {
                infoBuilder.append("Machine - ").append(capacityKg).append("kg");
            } else {
                infoBuilder.append(machine.getName()).append(" - ").append(capacityKg).append("kg");
            }
            
            // Add info about other capacities with proper naming
            List<Double> otherCapacities = uniqueCapacities.stream()
                    .filter(cap -> cap != capacityKg)
                    .collect(Collectors.toList());
            
            if (!otherCapacities.isEmpty()) {
                infoBuilder.append(" - other machines: ");
                for (int i = 0; i < otherCapacities.size(); i++) {
                    if (i > 0) infoBuilder.append(", ");
                    double cap = otherCapacities.get(i);
                    if (cap > 8.0) {
                        infoBuilder.append("Machine - ").append(cap).append("kg");
                    } else {
                        // Find a machine with this capacity to get its name
                        String machineName = machines.stream()
                                .filter(m -> (m.getCapacityKg() != null ? m.getCapacityKg() : 8.0) == cap)
                                .findFirst()
                                .map(MachineItem::getName)
                                .orElse("Washer " + (i + 1));
                        infoBuilder.append(machineName).append(" - ").append(cap).append("kg");
                    }
                }
            }
            
            machineInfo = infoBuilder.toString();
        }
        
        // Add machine type to the info
        if (!machines.isEmpty() && machines.get(0).getType() != null) {
            machineInfo = machine.getType() + " - " + machineInfo;
        }
        
        return new LoadCalculationResult(loadsNeeded, plasticNeeded, capacityKg, machineInfo);
    }
    
    /**
     * Get display name based on capacity
     * Machines > 8kg are called "Machine", others keep their specific names
     */
    private String getMachineDisplayName(double capacity) {
        return capacity > 8.0 ? "Machine" : "Washer";
    }
    
    /**
     * Enhanced machine naming logic
     */
    private String getMachineDisplayName(MachineItem machine, double capacity) {
        if (capacity > 8.0) {
            return "Machine";
        } else {
            // For smaller machines, use their actual name or default to "Washer"
            String name = machine.getName();
            if (name == null || name.trim().isEmpty()) {
                return "Washer";
            }
            // If name contains numbers or specific identifiers, keep them
            return name;
        }
    }
    
    /**
     * Calculate loads using default washing machine type
     */
    public LoadCalculationResult calculateLoads(double totalWeightKg) {
        return calculateLoads(totalWeightKg, "Washer");
    }
    
    /**
     * Calculate loads based on service type (detect if it's a dryer service)
     */
    public LoadCalculationResult calculateLoadsForService(double totalWeightKg, String serviceName) {
        if (serviceName != null && serviceName.toLowerCase().contains("dry")) {
            // Dryer service - use dryer machines
            return calculateLoads(totalWeightKg, "Dryer");
        } else {
            // Default to washer for wash services
            return calculateLoads(totalWeightKg, "Washer");
        }
    }
    
    public static class LoadCalculationResult {
        private final int loads;
        private final int plasticBags;
        private final double machineCapacity;
        private final String machineInfo;
        
        public LoadCalculationResult(int loads, int plasticBags, double machineCapacity, String machineInfo) {
            this.loads = loads;
            this.plasticBags = plasticBags;
            this.machineCapacity = machineCapacity;
            this.machineInfo = machineInfo;
        }
        
        // Getters
        public int getLoads() { return loads; }
        public int getPlasticBags() { return plasticBags; }
        public double getMachineCapacity() { return machineCapacity; }
        public String getMachineInfo() { return machineInfo; }
    }
}