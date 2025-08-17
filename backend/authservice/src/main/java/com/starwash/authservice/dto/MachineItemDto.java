package com.starwash.authservice.dto;

public class MachineItemDto {

  private String id;
  private String name;
  private String type; // "Washer" or "Dryer"
  private Double capacityKg;
  private String status; // "Available", "In Use", "Maintenance"

  public MachineItemDto() {}

  public MachineItemDto(String id, String name, String type, Double capacityKg, String status) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.capacityKg = capacityKg;
    this.status = status;
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getName() { return name; }
  public void setName(String name) { this.name = name; }

  public String getType() { return type; }
  public void setType(String type) { this.type = type; }

  public Double getCapacityKg() { return capacityKg; }
  public void setCapacityKg(Double capacityKg) { this.capacityKg = capacityKg; }

  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
}