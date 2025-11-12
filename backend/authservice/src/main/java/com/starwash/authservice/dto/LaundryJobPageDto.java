package com.starwash.authservice.dto;

import java.util.List;

public class LaundryJobPageDto {
    private List<LaundryJobDto> jobs;
    private int currentPage;
    private int pageSize;
    private long totalItems;
    private int totalPages;

    public LaundryJobPageDto() {}

    public LaundryJobPageDto(List<LaundryJobDto> jobs, int currentPage, int pageSize, long totalItems, int totalPages) {
        this.jobs = jobs;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalItems = totalItems;
        this.totalPages = totalPages;
    }

    // Getters and Setters
    public List<LaundryJobDto> getJobs() {
        return jobs;
    }

    public void setJobs(List<LaundryJobDto> jobs) {
        this.jobs = jobs;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}