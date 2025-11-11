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
            response.put("machineName", result.getMachineName());
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

    public static class CalculateLoadsRequest {
        private Double totalWeightKg;
        private String machineType = "Washer";
        
        // Getters and setters
        public Double getTotalWeightKg() { return totalWeightKg; }
        public void setTotalWeightKg(Double totalWeightKg) { this.totalWeightKg = totalWeightKg; }
        public String getMachineType() { return machineType; }
        public void setMachineType(String machineType) { this.machineType = machineType; }
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