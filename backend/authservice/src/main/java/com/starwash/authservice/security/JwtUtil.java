package com.starwash.authservice.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.security.Key;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    private static final ZoneId MANILA_ZONE = ZoneId.of("Asia/Manila");

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String username, String role) {
        // Use Manila time for token timestamps
        ZonedDateTime manilaNow = ZonedDateTime.now(MANILA_ZONE);
        Date issuedAt = Date.from(manilaNow.toInstant());
        
        // Convert milliseconds to seconds for plusSeconds, or use plusNanos for millisecond precision
        ZonedDateTime manilaExpires = manilaNow.plusSeconds(jwtExpiration / 1000);
        Date expiresAt = Date.from(manilaExpires.toInstant());

        String token = Jwts.builder()
                .setSubject(username)
                .claim("role", role.toUpperCase())
                .setIssuedAt(issuedAt)
                .setExpiration(expiresAt)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();

        System.out.println("🛠️ Generated token for " + username);
        System.out.println("🕒 Manila Time Issued at: " + manilaNow);
        System.out.println("⏳ Manila Time Expires at: " + manilaExpires);
        System.out.println("🔑 Token: " + token);

        return token;
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            
            // Convert to Manila time for validation messages
            ZonedDateTime manilaNow = ZonedDateTime.now(MANILA_ZONE);
            Date now = new Date();
            Date exp = claims.getExpiration();

            long skewMs = 5000;
            if (exp.getTime() + skewMs < now.getTime()) {
                ZonedDateTime manilaExp = exp.toInstant().atZone(MANILA_ZONE);
                System.out.println("⏳ Token expired with skew for user: " + claims.getSubject());
                System.out.println("🕒 Manila Time Now: " + manilaNow);
                System.out.println("⏳ Manila Time Expired: " + manilaExp);
                return false;
            }

            System.out.println("✅ Token validated for user: " + claims.getSubject());
            System.out.println("🕒 Manila Time Validated: " + manilaNow);
            return true;
        } catch (ExpiredJwtException e) {
            ZonedDateTime manilaNow = ZonedDateTime.now(MANILA_ZONE);
            System.out.println("⏳ Token expired for user: " + e.getClaims().getSubject());
            System.out.println("🕒 Manila Time Now: " + manilaNow);
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
            return extractAllClaims(token).getSubject();
        } catch (Exception e) {
            System.out.println("❌ Error extracting username from token: " + e.getMessage());
            return null;
        }
    }

    public String getRole(String token) {
        try {
            String role = extractAllClaims(token).get("role", String.class);
            System.out.println("🔍 Extracted role from token: " + role);
            return role;
        } catch (Exception e) {
            System.out.println("❌ Error extracting role from token: " + e.getMessage());
            return null;
        }
    }

    public Date getIssuedAt(String token) {
        try {
            return extractAllClaims(token).getIssuedAt();
        } catch (Exception e) {
            System.out.println("❌ Error extracting issued at from token: " + e.getMessage());
            return null;
        }
    }

    public Date getExpiration(String token) {
        try {
            return extractAllClaims(token).getExpiration();
        } catch (Exception e) {
            System.out.println("❌ Error extracting expiration from token: " + e.getMessage());
            return null;
        }
    }

    // New method to get Manila time issued at
    public ZonedDateTime getManilaIssuedAt(String token) {
        try {
            Date issuedAt = extractAllClaims(token).getIssuedAt();
            return issuedAt.toInstant().atZone(MANILA_ZONE);
        } catch (Exception e) {
            System.out.println("❌ Error extracting Manila issued at from token: " + e.getMessage());
            return null;
        }
    }

    // New method to get Manila time expiration
    public ZonedDateTime getManilaExpiration(String token) {
        try {
            Date expiresAt = extractAllClaims(token).getExpiration();
            return expiresAt.toInstant().atZone(MANILA_ZONE);
        } catch (Exception e) {
            System.out.println("❌ Error extracting Manila expiration from token: " + e.getMessage());
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