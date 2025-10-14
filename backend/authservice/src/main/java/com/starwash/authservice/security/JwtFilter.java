package com.starwash.authservice.security;

import com.starwash.authservice.model.User;
import com.starwash.authservice.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain)
            throws ServletException, IOException {

        final String requestPath = request.getServletPath();
        final String method = request.getMethod();
        
        System.out.println("🔐 JwtFilter: " + method + " " + requestPath);
        
        // Skip filter for public endpoints
        if (requestPath.equals("/api/login") || 
            requestPath.equals("/api/register") || 
            requestPath.equals("/health") || 
            requestPath.equals("/api/health") ||
            requestPath.startsWith("/api/debug/") ||
            requestPath.startsWith("/api/test/")) {
            System.out.println("✅ Public endpoint, skipping JWT: " + requestPath);
            chain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("❌ No Bearer token for: " + requestPath);
            chain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            final String username = jwtUtil.getUsername(jwt);

            System.out.println("🔍 Token found, username: " + username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtUtil.validateToken(jwt)) {
                    System.out.println("✅ Token validated for: " + username);
                    
                    // Get user from database
                    Optional<User> userDetails = userRepository.findByUsername(username);
                    
                    if (userDetails.isPresent() && "Active".equals(userDetails.get().getStatus())) {
                        String role = jwtUtil.getRole(jwt);
                        System.out.println("🎯 User role: " + role);
                        
                        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                            new SimpleGrantedAuthority("ROLE_" + role)
                        );

                        UsernamePasswordAuthenticationToken authToken = 
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                        
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        
                        System.out.println("✅ Authentication set for: " + username + " with role: ROLE_" + role);
                        
                        // Verify authentication was set
                        if (SecurityContextHolder.getContext().getAuthentication() != null) {
                            System.out.println("🔍 SecurityContext contains: " + 
                                SecurityContextHolder.getContext().getAuthentication().getName());
                        }
                    } else {
                        System.out.println("❌ User not found or inactive: " + username);
                    }
                } else {
                    System.out.println("❌ Token validation failed for: " + username);
                }
            } else {
                System.out.println("❌ Username null or already authenticated: " + username);
            }
        } catch (Exception e) {
            System.out.println("❌ JWT filter error: " + e.getMessage());
            e.printStackTrace();
        }

        chain.doFilter(request, response);
    }
}