package com.starwash.authservice.repository;

import com.starwash.authservice.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findAllByOrderByCreatedAtDesc();
}
