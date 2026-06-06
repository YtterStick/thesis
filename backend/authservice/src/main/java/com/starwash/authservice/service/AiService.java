package com.starwash.authservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.starwash.authservice.config.GeminiConfig;
import com.starwash.authservice.model.StockItem;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AiService {

    private final RestTemplate restTemplate;
    private final GeminiConfig geminiConfig;
    private final ObjectMapper objectMapper;

    // Base URL template — model name is injected dynamically
    private static final String GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

    // Ordered list of models to try (primary → fallback).
    // Free tier limits (as of 2025): each model has its own separate quota!
    // gemini-2.5-flash: 5 RPM, 250K TPM, 20 RPD
    // gemini-2.0-flash: 5 RPM, 250K TPM, 20 RPD (if available)
    // gemini-2.0-flash-lite: lighter model, separate quota
    private static final String[] MODEL_PRIORITY = {
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash"
    };

    // --- In-memory response cache ---
    // Cache duration: 4 hours (14400 seconds).
    // With 3 AI features and 20 RPD limit, 4h cache = max 6 calls/day for an 8h workday.
    private static final long CACHE_TTL_SECONDS = 14400;
    private final ConcurrentHashMap<String, CachedResponse> responseCache = new ConcurrentHashMap<>();

    private static class CachedResponse {
        final String response;
        final Instant expiresAt;
        final String modelUsed;

        CachedResponse(String response, long ttlSeconds, String modelUsed) {
            this.response = response;
            this.expiresAt = Instant.now().plusSeconds(ttlSeconds);
            this.modelUsed = modelUsed;
        }

        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    public AiService(RestTemplate geminiRestTemplate, GeminiConfig geminiConfig) {
        this.restTemplate = geminiRestTemplate;
        this.geminiConfig = geminiConfig;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Clear all cached AI responses. Call this when you want fresh insights.
     */
    public void clearCache() {
        responseCache.clear();
        System.out.println("🧹 AI response cache cleared.");
    }

    /**
     * Clear a specific cache entry by key.
     */
    public void clearCache(String key) {
        responseCache.remove(key);
    }

    public String generateSalesInsights(Map<String, Object> dashboardTotals) {
        String apiKey = geminiConfig.getGeminiApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            return "AI Insights are currently unavailable. Please configure the Gemini API Key.";
        }

        String prompt = "You are an AI business assistant for a laundry shop called StarWash. " +
                "Analyze the following dashboard totals and provide a short, encouraging 2-3 sentence business insight. " +
                "Don't use markdown formatting, just plain text. " +
                "Data: Total Income: ₱" + dashboardTotals.get("totalIncome") + 
                ", Total Loads Processed: " + dashboardTotals.get("totalLoads") +
                ", Pending Unclaimed Jobs: " + dashboardTotals.get("totalUnclaimed") +
                ", Currently Unwashed Loads: " + dashboardTotals.get("unwashedCount");

        return getCachedOrFetch("sales_insights", prompt);
    }

    public String predictInventoryRestock(List<StockItem> stockItems) {
        String apiKey = geminiConfig.getGeminiApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            return "Inventory predictions are currently unavailable. Please configure the Gemini API Key.";
        }

        String inventoryData = stockItems.stream()
                .map(item -> String.format("%s: %d %s (Low threshold: %d)", 
                        item.getName(), item.getQuantity(), item.getUnit(), item.getLowStockThreshold()))
                .collect(Collectors.joining(", "));

        String prompt = "You are an AI inventory manager for a laundry shop called StarWash. " +
                "Review the following current stock levels and their low-stock thresholds. " +
                "Identify which items urgently need restocking and suggest a restock amount (usually double the low threshold) to keep operations running smoothly. " +
                "Keep it concise (2-3 sentences), friendly, and directly actionable. " +
                "Data: " + inventoryData;

        return getCachedOrFetch("inventory_restock", prompt);
    }

    public String generateSchedulingRecommendations(List<com.starwash.authservice.model.LaundryJob> recentJobs, List<com.starwash.authservice.model.MachineItem> machines) {
        String apiKey = geminiConfig.getGeminiApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            return "Scheduling recommendations are currently unavailable. Please configure the Gemini API Key.";
        }

        long activeJobs = recentJobs.stream()
                .filter(job -> !"COMPLETED".equals(job.getPickupStatus()))
                .count();

        long machinesNeedingMaintenance = machines.stream()
                .filter(m -> "NEEDS_MAINTENANCE".equalsIgnoreCase(m.getStatus()) || "BROKEN".equalsIgnoreCase(m.getStatus()))
                .count();

        long availableMachines = machines.stream()
                .filter(m -> "AVAILABLE".equalsIgnoreCase(m.getStatus()) || "IN_USE".equalsIgnoreCase(m.getStatus()))
                .count();

        String prompt = "You are an AI operations manager for a laundry shop called StarWash. " +
                "Analyze the current workload and machine status to provide a 2-3 sentence recommendation on staff scheduling and machine maintenance. " +
                "Don't use markdown formatting, just plain text. " +
                "Data: Active Laundry Jobs: " + activeJobs + 
                ", Available/Working Machines: " + availableMachines +
                ", Machines needing maintenance or broken: " + machinesNeedingMaintenance;

        return getCachedOrFetch("scheduling", prompt);
    }

    public String analyzeReviews(List<com.starwash.authservice.model.Review> reviews) {
        String apiKey = geminiConfig.getGeminiApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            return "Review analysis is currently unavailable. Please configure the Gemini API Key.";
        }

        if (reviews == null || reviews.isEmpty()) {
            return "No reviews available to analyze yet.";
        }

        String reviewData = reviews.stream()
                .map(r -> String.format("Rating: %d/5, Comment: '%s'", r.getRating(), r.getComment()))
                .collect(Collectors.joining(" | "));

        String prompt = "You are an AI customer experience manager for a laundry shop called StarWash. " +
                "Analyze the following recent customer reviews. Provide a short, 2-3 sentence summary of the overall sentiment " +
                "and highlight any actionable areas for improvement or recurring praise. " +
                "Don't use markdown formatting, just plain text. " +
                "Reviews: " + reviewData;

        return getCachedOrFetch("sentiment", prompt);
    }

    public String analyzeMachineHealth(List<Map<String, Object>> machineHealthData) {
        String apiKey = geminiConfig.getGeminiApiKey();
        if (apiKey == null || apiKey.isEmpty()) {
            return "AI Machine Health analysis is currently unavailable. Please configure the Gemini API Key.";
        }

        String machineDataString = machineHealthData.stream()
                .map(m -> String.format("%s (%s): %s loads since %s. Status: %s. Severity: %s.",
                        m.get("machineName"),
                        m.get("machineType"),
                        m.get("totalLoadsProcessed") != null ? m.get("totalLoadsProcessed").toString() : "0",
                        m.get("lastMaintenance") == null || m.get("lastMaintenance").toString().isEmpty() ? "never" : m.get("lastMaintenance"),
                        m.get("status"),
                        m.get("severity")))
                .collect(Collectors.joining(" | "));

        String prompt = "You are an AI maintenance engineer for a laundry shop called StarWash. " +
                "Analyze the following machine usage statistics and identify critical risks (e.g. machines with high load counts like >100 or >200, or machines never maintained). " +
                "Provide a highly actionable, 2-3 sentence warning and prediction. Bold the machine names (e.g. **Dryer 1**) that need immediate attention, and reference what specific issue they face. " +
                "Data: " + machineDataString;

        return getCachedOrFetch("machine_health_analysis", prompt);
    }

    /**
     * Returns a cached response if available and not expired, otherwise calls the API and caches the result.
     */
    private String getCachedOrFetch(String cacheKey, String prompt) {
        CachedResponse cached = responseCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            long minutesLeft = java.time.Duration.between(Instant.now(), cached.expiresAt).toMinutes();
            System.out.println("✅ AI cache HIT for key: " + cacheKey + 
                " (model: " + cached.modelUsed + ", expires in " + minutesLeft + " min)");
            return cached.response;
        }

        System.out.println("🔄 AI cache MISS for key: " + cacheKey + " — calling Gemini API with fallback...");
        String[] result = callGeminiApiWithFallback(prompt);
        String response = result[0];
        String modelUsed = result[1];
        
        // Only cache successful responses (not error messages)
        if (!response.startsWith("An error occurred") && !response.startsWith("Failed to generate") && !response.startsWith("All AI models")) {
            responseCache.put(cacheKey, new CachedResponse(response, CACHE_TTL_SECONDS, modelUsed));
            System.out.println("💾 Cached AI response for key: " + cacheKey + 
                " (model: " + modelUsed + ", TTL: " + CACHE_TTL_SECONDS / 60 + " min)");
        }

        return response;
    }

    /**
     * Try each model in the priority list. If one hits a rate limit (429), try the next.
     * Each model has its own separate free-tier quota, so this effectively triples our daily limits.
     */
    private String[] callGeminiApiWithFallback(String prompt) {
        String lastError = "";

        for (String model : MODEL_PRIORITY) {
            try {
                System.out.println("🤖 Trying model: " + model);
                String response = callGeminiApi(prompt, model);
                
                // If we got a successful response (not an error), return it
                if (!response.startsWith("An error occurred") && !response.startsWith("Failed to generate")) {
                    System.out.println("✅ Success with model: " + model);
                    return new String[]{response, model};
                }
                
                lastError = response;
                System.out.println("⚠️ Model " + model + " returned error, trying next...");
                
            } catch (HttpClientErrorException.TooManyRequests e) {
                System.out.println("⚠️ Rate limited on model: " + model + " (429 Too Many Requests). Trying next model...");
                lastError = "Rate limited on " + model;
            } catch (HttpClientErrorException e) {
                System.out.println("⚠️ HTTP error on model " + model + ": " + e.getStatusCode() + " - " + e.getMessage());
                lastError = "HTTP " + e.getStatusCode() + " on " + model;
            } catch (Exception e) {
                System.out.println("⚠️ Error on model " + model + ": " + e.getMessage());
                lastError = e.getMessage();
            }
        }

        System.err.println("❌ All AI models exhausted. Last error: " + lastError);
        return new String[]{"All AI models are currently at their free-tier limit. Insights will refresh automatically. Last error: " + lastError, "none"};
    }

    private String callGeminiApi(String prompt, String model) {
        String url = GEMINI_API_BASE + model + ":generateContent?key=" + geminiConfig.getGeminiApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Construct the Gemini API payload
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", new Object[]{part});
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", new Object[]{content});

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                String.class
        );

        if (response.getStatusCode() == HttpStatus.OK) {
            try {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                return rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            } catch (Exception e) {
                return "Failed to parse AI response: " + e.getMessage();
            }
        } else {
            return "Failed to generate AI insights. API returned status: " + response.getStatusCode();
        }
    }
}
