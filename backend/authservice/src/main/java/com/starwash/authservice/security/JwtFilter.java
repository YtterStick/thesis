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

        String path = request.getRequestURI();
        System.out.println("🛡️ JwtFilter processing: " + path);

        // Public endpoints - FIXED: Include API paths
        if (path.equals("/api/login") || path.equals("/api/register") || 
            path.equals("/login") || path.equals("/register") ||
            path.equals("/")) {
            System.out.println("✅ Public endpoint, skipping auth: " + path);
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            System.out.println("🔐 Token found for: " + path);

            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsername(token);
                String role = jwtUtil.getRole(token);
                System.out.println("✅ Token valid for user: " + username + " with role: " + role);

                Optional<User> userOpt = userRepository.findByUsername(username);
                if (userOpt.isPresent() && "Active".equals(userOpt.get().getStatus())) {
                    // Create authority with ROLE_ prefix
                    String authority = "ROLE_" + role.toUpperCase();
                    List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(authority));
                    
                    System.out.println("🎯 Setting authentication with authority: " + authority);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    System.out.println("✅ Authenticated: " + username + " [" + authority + "] for " + path);
                } else {
                    System.out.println("❌ User not found or inactive: " + username);
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.getWriter().write("Account is deactivated");
                    return;
                }
            } else {
                System.out.println("❌ Invalid token for: " + path);
            }
        } else {
            System.out.println("❌ No Authorization header for protected endpoint: " + path);
        }

        chain.doFilter(request, response);
    }
}