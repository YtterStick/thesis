package com.starwash.authservice.repository;

import com.starwash.authservice.model.Term;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TermRepository extends MongoRepository<Term, String> {
  // Optional: add findByTitleContaining if needed
}