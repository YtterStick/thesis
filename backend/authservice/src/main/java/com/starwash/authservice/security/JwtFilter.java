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
        String method = request.getMethod();
        
        System.out.println("🔍 JwtFilter processing: " + method + " " + path);

        // Don't process authentication for public endpoints
        if (path.equals("/api/login") || path.equals("/api/register") || 
            path.equals("/api/health") || path.equals("/") ||
            path.equals("/health") || path.startsWith("/api/debug")) {
            System.out.println("✅ Public endpoint, skipping auth: " + path);
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsername(token);
                String role = jwtUtil.getRole(token);
                
                System.out.println("📝 Token details - Username: " + username + ", Role: " + role);

                // Check if user exists and is active
                Optional<User> userOpt = userRepository.findByUsername(username);
                boolean userValid = false;
                
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    System.out.println("👤 User found - Status: " + user.getStatus() + ", Role: " + user.getRole());
                    userValid = "Active".equals(user.getStatus());
                } else {
                    System.out.println("⚠️ User not found in database: " + username);
                    // For now, we'll allow the request if token is valid but user not in DB
                    // This handles cases where user was deleted but token is still valid
                    userValid = true;
                }

                if (userValid && role != null) {
                    // Use role from token for authorization
                    System.out.println("🎯 Setting authentication with role: ROLE_" + role);
                    
                    List<SimpleGrantedAuthority> authorities =
                            List.of(new SimpleGrantedAuthority("ROLE_" + role));

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    System.out.println("✅ SUCCESS: Authenticated " + username + " as ROLE_" + role + " for " + path);
                } else {
                    System.out.println("❌ FAIL: User validation failed - Valid: " + userValid + ", Role: " + role);
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.getWriter().write("User validation failed");
                    return;
                }
            } else {
                System.out.println("❌ FAIL: Invalid token for path: " + path);
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.getWriter().write("Invalid or expired token");
                return;
            }
        } else {
            System.out.println("⚠️ WARNING: No valid Authorization header for: " + path);
            // Let Spring Security handle unauthorized requests
        }

        chain.doFilter(request, response);
    }
}