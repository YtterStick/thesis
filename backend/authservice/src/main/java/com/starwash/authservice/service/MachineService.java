package com.starwash.authservice.service;

import com.starwash.authservice.model.MachineItem;
import com.starwash.authservice.repository.MachineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MachineService {
    
    private final MachineRepository machineRepository;
    
    public MachineService(MachineRepository machineRepository) {
        this.machineRepository = machineRepository;
    }
    
    /**
     * Calculate number of loads needed based on total weight and machine capacity
     */
    public LoadCalculationResult calculateLoads(double totalWeightKg, String machineType) {
        // Get available machines of the specified type
        List<MachineItem> availableMachines = machineRepository.findByStatusAndType("Available", machineType);
        
        if (availableMachines.isEmpty()) {
            // Fallback to any machine of the type
            availableMachines = machineRepository.findByType(machineType);
            if (availableMachines.isEmpty()) {
                throw new RuntimeException("No " + machineType + " machines found");
            }
        }
        
        // Use the first available machine's capacity
        MachineItem machine = availableMachines.get(0);
        double capacityKg = machine.getCapacityKg() != null ? machine.getCapacityKg() : 8.0; // Default to 8kg if null
        
        // Calculate number of loads needed (round up)
        int loadsNeeded = (int) Math.ceil(totalWeightKg / capacityKg);
        
        // Calculate plastic needed (typically 1 plastic per load)
        int plasticNeeded = loadsNeeded;
        
        return new LoadCalculationResult(loadsNeeded, plasticNeeded, capacityKg, machine.getName());
    }
    
    /**
     * Calculate loads using default washing machine type
     */
    public LoadCalculationResult calculateLoads(double totalWeightKg) {
        return calculateLoads(totalWeightKg, "Washer");
    }
    
    public static class LoadCalculationResult {
        private final int loads;
        private final int plasticBags;
        private final double machineCapacity;
        private final String machineName;
        
        public LoadCalculationResult(int loads, int plasticBags, double machineCapacity, String machineName) {
            this.loads = loads;
            this.plasticBags = plasticBags;
            this.machineCapacity = machineCapacity;
            this.machineName = machineName;
        }
        
        // Getters
        public int getLoads() { return loads; }
        public int getPlasticBags() { return plasticBags; }
        public double getMachineCapacity() { return machineCapacity; }
        public String getMachineName() { return machineName; }
    }
}