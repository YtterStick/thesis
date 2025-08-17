package com.starwash.authservice.controller;

import com.starwash.authservice.dto.TermDto;
import com.starwash.authservice.model.Term;
import com.starwash.authservice.repository.TermRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/terms")
public class TermController {

  @Autowired
  private TermRepository termRepository;

  // 🔍 GET all terms
  @GetMapping
  public ResponseEntity<List<TermDto>> getAllTerms() {
    List<TermDto> dtos = termRepository.findAll().stream()
      .map(this::toDto)
      .collect(Collectors.toList());
    return ResponseEntity.ok(dtos);
  }

  // ➕ POST new term
  @PostMapping
  public ResponseEntity<TermDto> createTerm(@RequestBody TermDto dto) {
    Term term = toEntity(dto);
    term.setId(null); // ensure new insert
    Term saved = termRepository.save(term);
    return ResponseEntity.ok(toDto(saved));
  }

  // ✏️ PUT update existing term
  @PutMapping("/{id}")
  public ResponseEntity<TermDto> updateTerm(@PathVariable String id, @RequestBody TermDto dto) {
    if (!termRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }

    Term term = toEntity(dto);
    term.setId(id); // ensure correct ID
    Term updated = termRepository.save(term);
    return ResponseEntity.ok(toDto(updated));
  }

  // ❌ DELETE term
  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteTerm(@PathVariable String id) {
    if (!termRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    termRepository.deleteById(id);
    return ResponseEntity.ok().build();
  }

  // 🔄 DTO mapping
  private TermDto toDto(Term term) {
    return new TermDto(term.getId(), term.getTitle(), term.getContent());
  }

  private Term toEntity(TermDto dto) {
    return new Term(dto.getId(), dto.getTitle(), dto.getContent());
  }
}