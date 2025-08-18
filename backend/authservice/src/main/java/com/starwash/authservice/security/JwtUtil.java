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
            Claims claims = extractClaims(token);
            Date now = new Date();
            Date exp = claims.getExpiration();

            long skewMs = 5000; // match frontend
            if (exp.getTime() + skewMs < now.getTime()) {
                System.out.println("⏳ Token expired with skew for user: " + claims.getSubject());
                return false;
            }

            return true;
        } catch (ExpiredJwtException e) {
            System.out.println("⏳ Token expired for user: " + e.getClaims().getSubject());
        } catch (JwtException e) {
            System.out.println("❌ JWT validation failed: " + e.getMessage());
        }
        return false;
    }

    public String getUsername(String token) {
        try {
            return extractClaims(token).getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    public String getRole(String token) {
        try {
            return extractClaims(token).get("role", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public Date getIssuedAt(String token) {
        try {
            return extractClaims(token).getIssuedAt();
        } catch (Exception e) {
            return null;
        }
    }

    public Date getExpiration(String token) {
        try {
            return extractClaims(token).getExpiration();
        } catch (Exception e) {
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