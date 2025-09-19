package com.starwash.authservice.controller;

import com.starwash.authservice.dto.MachineItemDto;
import com.starwash.authservice.model.MachineItem;
import com.starwash.authservice.repository.MachineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/machines")
public class MachineController {

    @Autowired
    private MachineRepository machineRepository;

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