package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "machines")
public class MachineItem {

  @Id
  private String id;

  private String name;
  private String type;
  private Double capacityKg;
  private String status;
  private String lastMaintenance; // ISO date string
  private String nextMaintenance; // ISO date string

  public MachineItem() {}

  public MachineItem(String id, String name, String type, Double capacityKg, String status, String lastMaintenance, String nextMaintenance) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.capacityKg = capacityKg;
    this.status = status;
    this.lastMaintenance = lastMaintenance;
    this.nextMaintenance = nextMaintenance;
  }

  // Getters and setters for all fields
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

  public String getLastMaintenance() { return lastMaintenance; }
  public void setLastMaintenance(String lastMaintenance) { this.lastMaintenance = lastMaintenance; }

  public String getNextMaintenance() { return nextMaintenance; }
  public void setNextMaintenance(String nextMaintenance) { this.nextMaintenance = nextMaintenance; }
}