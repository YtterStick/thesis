package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "laundry_jobs")
public class LaundryJob {

  @Id
  private String id;

  private String transactionId;
  private String customerName;
  private Integer loads;
  private Integer detergentQty;
  private Integer fabricQty;
  private String machineId;
  private List<String> statusFlow;
  private Integer currentStep;

  public LaundryJob() {}

  public LaundryJob(String transactionId, String customerName, Integer loads,
                    Integer detergentQty, Integer fabricQty, String machineId,
                    List<String> statusFlow, Integer currentStep) {
    this.transactionId = transactionId;
    this.customerName = customerName;
    this.loads = loads;
    this.detergentQty = detergentQty;
    this.fabricQty = fabricQty;
    this.machineId = machineId;
    this.statusFlow = statusFlow;
    this.currentStep = currentStep;
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getTransactionId() { return transactionId; }
  public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

  public String getCustomerName() { return customerName; }
  public void setCustomerName(String customerName) { this.customerName = customerName; }

  public Integer getLoads() { return loads; }
  public void setLoads(Integer loads) { this.loads = loads; }

  public Integer getDetergentQty() { return detergentQty; }
  public void setDetergentQty(Integer detergentQty) { this.detergentQty = detergentQty; }

  public Integer getFabricQty() { return fabricQty; }
  public void setFabricQty(Integer fabricQty) { this.fabricQty = fabricQty; }

  public String getMachineId() { return machineId; }
  public void setMachineId(String machineId) { this.machineId = machineId; }

  public List<String> getStatusFlow() { return statusFlow; }
  public void setStatusFlow(List<String> statusFlow) { this.statusFlow = statusFlow; }

  public Integer getCurrentStep() { return currentStep; }
  public void setCurrentStep(Integer currentStep) { this.currentStep = currentStep; }
}