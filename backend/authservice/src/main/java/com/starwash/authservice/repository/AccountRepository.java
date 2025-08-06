package com.starwash.authservice.repository;

import com.starwash.authservice.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends MongoRepository<User, String> {

    // Find user by username (useful for login/auth)
    Optional<User> findByUsername(String username);

    // Find all users with a specific role (e.g., ADMIN, STAFF)
    List<User> findByRole(String role);

    // You can still use findAll() from MongoRepository, no need to override it
}
