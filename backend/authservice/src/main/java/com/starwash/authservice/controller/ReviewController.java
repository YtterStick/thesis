package com.starwash.authservice.controller;

import com.starwash.authservice.model.Review;
import com.starwash.authservice.repository.ReviewRepository;
import com.starwash.authservice.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final AiService aiService;

    public ReviewController(ReviewRepository reviewRepository, AiService aiService) {
        this.reviewRepository = reviewRepository;
        this.aiService = aiService;
    }

    @PostMapping
    public ResponseEntity<Review> submitReview(@RequestBody Review review) {
        if (review.getCreatedAt() == null) {
            review.setCreatedAt(java.time.LocalDateTime.now());
        }
        Review saved = reviewRepository.save(review);
        // Clear the sentiment cache so the next fetch picks up the new review
        aiService.clearCache("sentiment");
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<Review>> getReviews() {
        return ResponseEntity.ok(reviewRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/sentiment")
    public ResponseEntity<Map<String, String>> getSentimentAnalysis(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Allow without strict auth for now, or just check if it exists
        List<Review> recentReviews = reviewRepository.findAllByOrderByCreatedAtDesc();
        // optionally limit to top 20
        if (recentReviews.size() > 20) {
            recentReviews = recentReviews.subList(0, 20);
        }
        
        String sentiment = aiService.analyzeReviews(recentReviews);
        return ResponseEntity.ok(Map.of("sentiment", sentiment));
    }
}
