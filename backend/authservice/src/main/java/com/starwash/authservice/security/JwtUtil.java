package com.starwash.authservice.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
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
        Date issuedAt = new Date();
        Date expiresAt = new Date(System.currentTimeMillis() + jwtExpiration);

        String token = Jwts.builder()
                .setSubject(username)
                .claim("role", role.toUpperCase())
                .setIssuedAt(issuedAt)
                .setExpiration(expiresAt)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();

        System.out.println("🛠️ Generated token for " + username);
        System.out.println("🕒 Issued at: " + issuedAt);
        System.out.println("⏳ Expires at: " + expiresAt);
        System.out.println("🔑 Token: " + token);

        return token;
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token); // FIXED: Changed from extractClaims to extractAllClaims
            Date now = new Date();
            Date exp = claims.getExpiration();

            long skewMs = 5000;
            if (exp.getTime() + skewMs < now.getTime()) {
                System.out.println("⏳ Token expired with skew for user: " + claims.getSubject());
                return false;
            }

            System.out.println("✅ Token validated for user: " + claims.getSubject());
            return true;
        } catch (ExpiredJwtException e) {
            System.out.println("⏳ Token expired for user: " + e.getClaims().getSubject());
        } catch (JwtException e) {
            System.out.println("❌ JWT validation failed: " + e.getMessage());
        }
        return false;
    }

    public String extractUsername(String token) {
        return getUsername(token);
    }

    public String getUsername(String token) {
        try {
            return extractAllClaims(token).getSubject(); // FIXED: Changed from extractClaims to extractAllClaims
        } catch (Exception e) {
            System.out.println("❌ Error extracting username from token: " + e.getMessage());
            return null;
        }
    }

    public String getRole(String token) {
        try {
            String role = extractAllClaims(token).get("role", String.class); // FIXED: Changed from extractClaims to extractAllClaims
            System.out.println("🔍 Extracted role from token: " + role);
            return role;
        } catch (Exception e) {
            System.out.println("❌ Error extracting role from token: " + e.getMessage());
            return null;
        }
    }

    public Date getIssuedAt(String token) {
        try {
            return extractAllClaims(token).getIssuedAt(); // FIXED: Changed from extractClaims to extractAllClaims
        } catch (Exception e) {
            System.out.println("❌ Error extracting issued at from token: " + e.getMessage());
            return null;
        }
    }

    public Date getExpiration(String token) {
        try {
            return extractAllClaims(token).getExpiration(); // FIXED: Changed from extractClaims to extractAllClaims
        } catch (Exception e) {
            System.out.println("❌ Error extracting expiration from token: " + e.getMessage());
            return null;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}