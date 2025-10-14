package com.starwash.authservice.security;

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

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
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
            path.equals("/health") || path.startsWith("/api/debug") ||
            path.startsWith("/api/test")) {
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

                if (role != null) {
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
                    System.out.println("❌ FAIL: No role in token");
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.getWriter().write("No role in token");
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