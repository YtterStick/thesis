package com.starwash.authservice.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.security.Key;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String username, String role) {
        String token = Jwts.builder()
            .setSubject(username)
            .claim("role", role.toUpperCase())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();

        System.out.println("🛠️ Generated token for " + username + ": " + token);
        return token;
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);

            System.out.println("✅ Token validated");
            return true;
        } catch (ExpiredJwtException e) {
            System.out.println("⚠️ Token expired: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.out.println("⚠️ Unsupported token: " + e.getMessage());
        } catch (MalformedJwtException e) {
            System.out.println("⚠️ Malformed token: " + e.getMessage());
        } catch (SecurityException e) {
            System.out.println("⚠️ Invalid signature: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Illegal argument: " + e.getMessage());
        }
        return false;
    }

    public String getUsername(String token) {
        try {
            Claims claims = extractClaims(token);
            String username = claims.getSubject();
            System.out.println("👤 Extracted username: " + username);
            return username;
        } catch (Exception e) {
            System.out.println("❌ Failed to extract username: " + e.getMessage());
            return null;
        }
    }

    public String getRole(String token) {
        try {
            Claims claims = extractClaims(token);
            String role = claims.get("role", String.class);
            System.out.println("🔐 Extracted role: " + role);
            return role;
        } catch (Exception e) {
            System.out.println("❌ Failed to extract role: " + e.getMessage());
            return null;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}
