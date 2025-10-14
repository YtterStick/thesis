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

        // Don't process authentication for public endpoints
        String path = request.getRequestURI();
        if (path.equals("/api/login") || path.equals("/api/register") || 
            path.equals("/api/health") || path.equals("/") ||
            path.equals("/health")) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsername(token);
                String role = jwtUtil.getRole(token);

                Optional<User> userOpt = userRepository.findByUsername(username);
                if (userOpt.isPresent() && "Active".equals(userOpt.get().getStatus())) {
                    List<SimpleGrantedAuthority> authorities =
                            List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    System.out.println("✅ Authenticated: " + username + " [" + role + "] for " + path);
                } else {
                    System.out.println("❌ User not found or inactive: " + username);
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.getWriter().write("Account is deactivated");
                    return;
                }
            } else {
                System.out.println("❌ Invalid token for path: " + path);
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.getWriter().write("Invalid or expired token");
                return;
            }
        } else {
            System.out.println("❌ No Authorization header for path: " + path);
            // Don't block here - let Spring Security handle unauthorized requests
        }

        chain.doFilter(request, response);
    }
}