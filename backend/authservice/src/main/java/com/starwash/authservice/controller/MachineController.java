package com.starwash.authservice.controller;

import com.starwash.authservice.dto.MachineItemDto;
import com.starwash.authservice.model.MachineItem;
import com.starwash.authservice.repository.MachineRepository;
import com.starwash.authservice.service.MachineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/machines")
public class MachineController {

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private MachineService machineService;

    @GetMapping
    public ResponseEntity<List<MachineItemDto>> getAllMachines() {
        List<MachineItemDto> dtos = machineRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<MachineItemDto> createMachine(@RequestBody MachineItemDto dto) {
        MachineItem item = toEntity(dto);
        item.setId(null);
        MachineItem saved = machineRepository.save(item);
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MachineItemDto> updateMachine(@PathVariable String id, @RequestBody MachineItemDto dto) {
        return machineRepository.findById(id)
                .map(existing -> {
                    existing.setName(dto.getName());
                    existing.setType(dto.getType());
                    existing.setCapacityKg(dto.getCapacityKg());
                    existing.setStatus(dto.getStatus());
                    existing.setLastMaintenance(dto.getLastMaintenance());
                    existing.setNextMaintenance(dto.getNextMaintenance());
                    MachineItem updated = machineRepository.save(existing);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMachine(@PathVariable String id) {
        if (!machineRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        machineRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // Add machine release endpoint
    @PatchMapping("/{id}/release")
    public ResponseEntity<MachineItemDto> releaseMachine(@PathVariable String id) {
        return machineRepository.findById(id)
                .map(machine -> {
                    machine.setStatus("Available");
                    MachineItem updated = machineRepository.save(machine);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // NEW ENDPOINT: Calculate loads based on weight
    @PostMapping("/calculate-loads")
    public ResponseEntity<Map<String, Object>> calculateLoads(
            @RequestBody CalculateLoadsRequest request) {
        try {
            MachineService.LoadCalculationResult result = machineService.calculateLoads(
                request.getTotalWeightKg(), 
                request.getMachineType()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("loads", result.getLoads());
            response.put("plasticBags", result.getPlasticBags());
            response.put("machineCapacity", result.getMachineCapacity());
            response.put("machineInfo", result.getMachineInfo());
            response.put("totalWeight", request.getTotalWeightKg());
            response.put("message", "Calculation successful");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // NEW ENDPOINT: Calculate loads based on service type
    @PostMapping("/calculate-loads-service")
    public ResponseEntity<Map<String, Object>> calculateLoadsForService(
            @RequestBody CalculateLoadsServiceRequest request) {
        try {
            MachineService.LoadCalculationResult result = machineService.calculateLoadsForService(
                request.getTotalWeightKg(), 
                request.getServiceName()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("loads", result.getLoads());
            response.put("plasticBags", result.getPlasticBags());
            response.put("machineCapacity", result.getMachineCapacity());
            response.put("machineInfo", result.getMachineInfo());
            response.put("totalWeight", request.getTotalWeightKg());
            response.put("message", "Calculation successful");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // NEW ENDPOINT: Get machine capacities
    @GetMapping("/capacities")
    public ResponseEntity<Map<String, Object>> getMachineCapacities() {
        List<MachineItem> machines = machineRepository.findAll();
        
        Map<String, Double> capacities = machines.stream()
                .collect(Collectors.toMap(
                    MachineItem::getName, 
                    machine -> machine.getCapacityKg() != null ? machine.getCapacityKg() : 8.0
                ));
        
        Map<String, Object> response = new HashMap<>();
        response.put("machines", capacities);
        response.put("defaultCapacity", 8.0); // Default capacity
        
        return ResponseEntity.ok(response);
    }

    // NEW ENDPOINT: Get machines with different capacities
    @GetMapping("/different-capacities")
    public ResponseEntity<Map<String, Object>> getMachinesWithDifferentCapacities() {
        List<MachineItem> allMachines = machineRepository.findAll();
        
        // Find machines that don't have standard 8kg capacity
        List<MachineItemDto> differentCapacityMachines = allMachines.stream()
                .filter(machine -> {
                    double capacity = machine.getCapacityKg() != null ? machine.getCapacityKg() : 8.0;
                    return capacity != 8.0;
                })
                .map(this::toDto)
                .collect(Collectors.toList());
        
        // Find the highest capacity machine
        MachineItem highestCapacityMachine = allMachines.stream()
                .max((m1, m2) -> {
                    double cap1 = m1.getCapacityKg() != null ? m1.getCapacityKg() : 8.0;
                    double cap2 = m2.getCapacityKg() != null ? m2.getCapacityKg() : 8.0;
                    return Double.compare(cap1, cap2);
                })
                .orElse(null);
        
        Map<String, Object> response = new HashMap<>();
        response.put("differentCapacityMachines", differentCapacityMachines);
        response.put("highestCapacityMachine", highestCapacityMachine != null ? toDto(highestCapacityMachine) : null);
        response.put("totalMachines", allMachines.size());
        response.put("standardCapacity", 8.0);
        
        return ResponseEntity.ok(response);
    }

    public static class CalculateLoadsRequest {
        private Double totalWeightKg;
        private String machineType = "Washer";
        
        // Getters and setters
        public Double getTotalWeightKg() { return totalWeightKg; }
        public void setTotalWeightKg(Double totalWeightKg) { this.totalWeightKg = totalWeightKg; }
        public String getMachineType() { return machineType; }
        public void setMachineType(String machineType) { this.machineType = machineType; }
    }

    public static class CalculateLoadsServiceRequest {
        private Double totalWeightKg;
        private String serviceName;
        
        // Getters and setters
        public Double getTotalWeightKg() { return totalWeightKg; }
        public void setTotalWeightKg(Double totalWeightKg) { this.totalWeightKg = totalWeightKg; }
        public String getServiceName() { return serviceName; }
        public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    }

    private MachineItemDto toDto(MachineItem item) {
        return new MachineItemDto(
                item.getId(),
                item.getName(),
                item.getType(),
                item.getCapacityKg(),
                item.getStatus(),
                item.getLastMaintenance(),
                item.getNextMaintenance()
        );
    }

    private MachineItem toEntity(MachineItemDto dto) {
        return new MachineItem(
                dto.getId(),
                dto.getName(),
                dto.getType(),
                dto.getCapacityKg(),
                dto.getStatus(),
                dto.getLastMaintenance(),
                dto.getNextMaintenance()
        );
    }
}