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
        String authHeader = request.getHeader("Authorization");

        System.out.println("🛡️ JwtFilter processing: " + method + " " + path);
        System.out.println("🔐 Authorization header: " + (authHeader != null ? "Present" : "Missing"));

        // Public endpoints - no auth required
        if (isPublicEndpoint(path, method)) {
            System.out.println("✅ Public endpoint, skipping auth: " + path);
            chain.doFilter(request, response);
            return;
        }

        // Check for Authorization header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("❌ No valid Authorization header for protected endpoint: " + path);
            sendError(response, HttpStatus.UNAUTHORIZED, "Authorization header required");
            return;
        }

        // Process JWT token
        String token = authHeader.substring(7);
        System.out.println("🔐 Token found, length: " + token.length());

        if (!jwtUtil.validateToken(token)) {
            System.out.println("❌ Invalid token for: " + path);
            sendError(response, HttpStatus.UNAUTHORIZED, "Invalid or expired token");
            return;
        }

        String username = jwtUtil.getUsername(token);
        String role = jwtUtil.getRole(token);
        System.out.println("✅ Token valid for user: " + username + " with role: " + role);

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            System.out.println("❌ User not found: " + username);
            sendError(response, HttpStatus.FORBIDDEN, "User not found");
            return;
        }

        User user = userOpt.get();
        if (!"Active".equals(user.getStatus())) {
            System.out.println("❌ User account inactive: " + username);
            sendError(response, HttpStatus.FORBIDDEN, "Account is deactivated");
            return;
        }

        // Set authentication in security context
        String authority = role.toUpperCase();
        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(authority));
        
        System.out.println("🎯 Setting authentication with authority: " + authority);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(username, null, authorities);

        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        System.out.println("✅ Authenticated: " + username + " [" + authority + "] for " + path);
        chain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path, String method) {
        // OPTIONS requests for CORS preflight
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // Public endpoints
        List<String> publicPaths = List.of(
            "/api/login",
            "/api/register", 
            "/login",
            "/register",
            "/health",
            "/api/health",
            "/"
        );

        return publicPaths.contains(path);
    }

    private void sendError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
        response.getWriter().flush();
    }
}