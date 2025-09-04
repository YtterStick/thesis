package com.starwash.authservice.service;

import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.LaundryJob.LoadAssignment;
import com.starwash.authservice.model.MachineItem;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.MachineRepository;
import com.starwash.authservice.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class LaundryJobService {

    @Autowired
    private LaundryJobRepository laundryJobRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MachineRepository machineRepository;

    /** Create a new laundry job with per-load assignments */
    public LaundryJob createJob(LaundryJobDto dto) {
        Transaction txn = transactionRepository
                .findByInvoiceNumber(dto.getTransactionId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Transaction not found for invoice: " + dto.getTransactionId()));

        List<LoadAssignment> assignments = new ArrayList<>();
        int totalLoads = txn.getServiceQuantity();
        for (int i = 1; i <= totalLoads; i++) {
            assignments.add(new LoadAssignment(i, null, "UNWASHED", null, null, null));
        }

        LaundryJob job = new LaundryJob();
        job.setTransactionId(dto.getTransactionId());
        job.setCustomerName(txn.getCustomerName());
        job.setLoadAssignments(assignments);
        job.setDetergentQty(dto.getDetergentQty());
        job.setFabricQty(dto.getFabricQty());
        job.setStatusFlow(dto.getStatusFlow());
        job.setCurrentStep(dto.getCurrentStep() != null ? dto.getCurrentStep() : 0);

        return laundryJobRepository.save(job);
    }

    /** Assign a machine to a specific load */
    public LaundryJob assignMachine(String transactionId, int loadNumber, String machineId) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        MachineItem machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new RuntimeException("Machine not found"));

        if (!"Available".equals(machine.getStatus())) {
            throw new RuntimeException("Machine is not available");
        }

        // Assign machine to load, but do not change machine status yet
        job.getLoadAssignments().stream()
                .filter(load -> load.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber))
                .setMachineId(machineId);

        return laundryJobRepository.save(job);
    }

    /** Start a load with duration */
    public LaundryJob startLoad(String transactionId, int loadNumber, Integer durationMinutes) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        if (load.getMachineId() == null) throw new RuntimeException("No machine assigned to this load");

        // Start the load
        LocalDateTime now = LocalDateTime.now();
        load.setStatus("WASHING");
        load.setStartTime(now);
        load.setDurationMinutes(durationMinutes);
        load.setEndTime(now.plusMinutes(durationMinutes));

        // Update machine status
        MachineItem machine = machineRepository.findById(load.getMachineId())
                .orElseThrow(() -> new RuntimeException("Machine not found"));
        machine.setStatus("In Use");
        machineRepository.save(machine);

        return laundryJobRepository.save(job);
    }

    /** Complete a load */
    public LaundryJob completeLoad(String transactionId, int loadNumber) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        load.setStatus("COMPLETED");
        load.setEndTime(LocalDateTime.now());

        if (load.getMachineId() != null) {
            MachineItem machine = machineRepository.findById(load.getMachineId())
                    .orElseThrow(() -> new RuntimeException("Machine not found"));
            machine.setStatus("Available");
            machineRepository.save(machine);
        }

        return laundryJobRepository.save(job);
    }

    /** Update duration for a specific load */
    public LaundryJob updateLoadDuration(String transactionId, int loadNumber, int durationMinutes) {
        LaundryJob job = findSingleJobByTransaction(transactionId);

        LoadAssignment load = job.getLoadAssignments().stream()
                .filter(l -> l.getLoadNumber() == loadNumber)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Load number not found: " + loadNumber));

        load.setDurationMinutes(durationMinutes);
        if (load.getStartTime() != null) {
            load.setEndTime(load.getStartTime().plusMinutes(durationMinutes));
        }

        return laundryJobRepository.save(job);
    }

    /** Update the current step of a laundry job */
    public LaundryJob updateCurrentStep(String transactionId, int newStep) {
        LaundryJob job = findSingleJobByTransaction(transactionId);
        job.setCurrentStep(newStep);
        return laundryJobRepository.save(job);
    }

    /** Get a job by ID */
    public LaundryJob getJobById(String id) {
        return laundryJobRepository.findById(id).orElse(null);
    }

    /** Update a laundry job entity */
    public LaundryJob updateJob(LaundryJob job) {
        return laundryJobRepository.save(job);
    }

    /** Delete a job by ID */
    public boolean deleteJobById(String id) {
        if (!laundryJobRepository.existsById(id)) return false;
        laundryJobRepository.deleteById(id);
        return true;
    }

    /** Get all jobs as DTOs */
    public List<LaundryJobDto> getAllJobs() {
        List<LaundryJob> jobs = laundryJobRepository.findAll();
        List<LaundryJobDto> result = new ArrayList<>();

        for (LaundryJob job : jobs) {
            Transaction tx = transactionRepository.findByInvoiceNumber(job.getTransactionId()).orElse(null);

            int detergentQty = 0;
            int fabricQty = 0;
            LocalDateTime issueDate = null;
            String serviceType = null;

            if (tx != null) {
                issueDate = tx.getIssueDate();
                serviceType = tx.getServiceName();

                if (tx.getConsumables() != null) {
                    detergentQty = tx.getConsumables().stream()
                            .filter(c -> c.getName().toLowerCase().contains("detergent"))
                            .mapToInt(c -> c.getQuantity())
                            .sum();

                    fabricQty = tx.getConsumables().stream()
                            .filter(c -> c.getName().toLowerCase().contains("fabric"))
                            .mapToInt(c -> c.getQuantity())
                            .sum();
                }
            }

            LaundryJobDto dto = new LaundryJobDto();
            dto.setTransactionId(job.getTransactionId());
            dto.setCustomerName(job.getCustomerName());
            dto.setLoadAssignments(job.getLoadAssignments());
            dto.setCurrentStep(job.getCurrentStep());
            dto.setStatusFlow(job.getStatusFlow());
            dto.setDetergentQty(detergentQty);
            dto.setFabricQty(fabricQty);
            dto.setIssueDate(issueDate);
            dto.setServiceType(serviceType);

            result.add(dto);
        }

        return result;
    }

    /** Helper method to get a single LaundryJob by transactionId */
    public LaundryJob findSingleJobByTransaction(String transactionId) {
        return laundryJobRepository.findByTransactionId(transactionId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Laundry job not found for transaction: " + transactionId));
    }
}
