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

        // Public endpoints - let them through without JWT check
        if (isPublicEndpoint(path)) {
            System.out.println("✅ Public endpoint, skipping JWT auth: " + path);
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        // If no Authorization header, continue without authentication
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("⚠️ No Bearer token for protected endpoint: " + path + " - allowing request to continue");
            chain.doFilter(request, response);
            return;
        }

        // We have a Bearer token, let's process it
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
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write("Invalid token");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path) {
        return path.equals("/api/login") || 
               path.equals("/api/register") || 
               path.equals("/login") || 
               path.equals("/register") ||
               path.equals("/health") || 
               path.equals("/api/health") ||
               path.equals("/") ||
               path.startsWith("/api/debug/") ||
               path.startsWith("/api/test/");
    }
}