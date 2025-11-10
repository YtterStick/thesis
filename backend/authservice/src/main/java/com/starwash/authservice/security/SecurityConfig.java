package com.starwash.authservice.security;

import com.starwash.authservice.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(JwtFilter jwtFilter, CustomUserDetailsService userDetailsService) {
        this.jwtFilter = jwtFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                    // Public endpoints - no authentication required
                    .requestMatchers(
                        "/api/login", 
                        "/api/register", 
                        "/api/logout",
                        "/login",
                        "/register",
                        "/",
                        "/health",
                        "/health",
                        "/laundry-jobs",
                        "/services",
                        "/services/**",
                        "/stock",
                        "/stock/**",
                        "/machines",
                        "/machines/**",
                        "/terms",
                        "/track/**"
                    ).permitAll()
                    
                    // OPTIONS preflight requests
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    
                    // Role-based endpoints
                    .requestMatchers("/dashboard/admin").hasRole("ADMIN")
                    .requestMatchers("/dashboard/staff").hasAnyRole("STAFF", "ADMIN")
                    .requestMatchers("/api/accounts/**").hasRole("ADMIN")
                    
                    // Authenticated endpoints
                    .requestMatchers("/me").authenticated()
                    
                    // Other API endpoints require authentication
                    .requestMatchers("/api/**").authenticated()
                    
                    .anyRequest().authenticated()
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .logout(logout -> logout.disable())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}