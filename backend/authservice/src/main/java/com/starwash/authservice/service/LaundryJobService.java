package com.starwash.authservice.service;

import com.starwash.authservice.dto.LaundryJobDto;
import com.starwash.authservice.model.LaundryJob;
import com.starwash.authservice.model.Transaction;
import com.starwash.authservice.repository.LaundryJobRepository;
import com.starwash.authservice.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LaundryJobService {

    @Autowired
    private LaundryJobRepository laundryJobRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    public LaundryJob createJob(LaundryJobDto dto) {
        Transaction txn = transactionRepository
                .findByInvoiceNumber(dto.getTransactionId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Transaction not found for invoice: " + dto.getTransactionId()));

        LaundryJob job = new LaundryJob();
        job.setTransactionId(dto.getTransactionId());
        job.setCustomerName(txn.getCustomerName()); // override from transaction
        job.setLoads(txn.getServiceQuantity());     // override from transaction
        job.setDetergentQty(dto.getDetergentQty());
        job.setFabricQty(dto.getFabricQty());
        job.setMachineId(dto.getMachineId());
        job.setStatusFlow(dto.getStatusFlow());
        job.setCurrentStep(dto.getCurrentStep() != null ? dto.getCurrentStep() : 0);
        return laundryJobRepository.save(job);
    }

    public LaundryJob advanceStep(String jobId) {
        LaundryJob job = laundryJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Laundry job not found"));

        int nextStep = job.getCurrentStep() + 1;
        if (nextStep < job.getStatusFlow().size()) {
            job.setCurrentStep(nextStep);
            return laundryJobRepository.save(job);
        }

        return job; // Already completed
    }

    public void updateCurrentStep(String jobId, Integer newStep) {
        LaundryJob job = laundryJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Laundry job not found"));

        if (newStep == null || newStep < 0 || newStep >= job.getStatusFlow().size()) {
            throw new IllegalArgumentException("Invalid step index: " + newStep);
        }

        job.setCurrentStep(newStep);
        laundryJobRepository.save(job);
    }

    public List<LaundryJobDto> getAllJobs() {
        List<LaundryJob> jobs = laundryJobRepository.findAll();

        return jobs.stream().map(job -> {
            Transaction tx = transactionRepository.findByInvoiceNumber(job.getTransactionId()).orElse(null);

            int detergentQty = 0;
            int fabricQty = 0;
            LocalDateTime issueDate = null;

            if (tx != null) {
                issueDate = tx.getIssueDate();

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
            dto.setLoads(job.getLoads());
            dto.setCurrentStep(job.getCurrentStep());
            dto.setStatusFlow(job.getStatusFlow());
            dto.setMachineId(job.getMachineId());
            dto.setDetergentQty(detergentQty);
            dto.setFabricQty(fabricQty);
            dto.setIssueDate(issueDate); // ✅ Correct setter

            return dto;
        }).toList();
    }

    public LaundryJob getJobById(String id) {
        return laundryJobRepository.findById(id).orElse(null);
    }
}