package com.starwash.authservice.model;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Collection;
import java.util.Collections;

@Document(collection = "users")
public class User implements UserDetails {

    @Id
    private String id;
    private String username;
    private String password;
    private String role;
    private String contact;
    private String status;

    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getRole() { return role; }
    public String getContact() { return contact; }
    public String getStatus() { return status; }

    public void setId(String id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setRole(String role) { this.role = role; }
    public void setContact(String contact) { this.contact = contact; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

    @Override
    public boolean isAccountNonExpired() {
        return "Active".equals(this.status);
    }

    @Override
    public boolean isAccountNonLocked() {
        return "Active".equals(this.status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return "Active".equals(this.status);
    }

    @Override
    public boolean isEnabled() {
        return "Active".equals(this.status);
    }
}