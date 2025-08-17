package com.starwash.authservice.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "terms")
public class Term {

  @Id
  private String id;

  private String title;
  private String content;

  public Term() {}

  public Term(String id, String title, String content) {
    this.id = id;
    this.title = title;
    this.content = content;
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }
}