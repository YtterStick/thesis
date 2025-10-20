## ☁️ Deployment Documentation: Hostinger Web Hosting vs VPS Challenge

### 🚨 The Deployment Mistake & Solution

#### ❌ The Problem: Wrong Hosting Type

**Mistake:**  
Accidentally purchased **Hostinger Web Hosting** instead of a **VPS** (Virtual Private Server).

#### ⚙️ Why This Was Problematic

| Component | Requirement | Issue |
|------------|--------------|--------|
| **Web Hosting** | Designed for static files (HTML, CSS, JS, basic PHP) | ❌ Cannot run Java or Spring Boot applications |
| **VPS** | Provides full root access and Java runtime environment | ✅ Required for Spring Boot backend |
| **React Vite Frontend** | Can be deployed as static files | ✅ Works fine on web hosting |
| **Spring Boot Backend** | Requires Java and dedicated server | ❌ Needs VPS or containerized environment |

---

### ✅ The Solution: Hybrid Deployment Architecture

To fix the issue, a **hybrid deployment model** was implemented:

```
               ┌────────────────────────────┐
               │        Hostinger           │
               │      Web Hosting           │
               │                            │
               │     React Vite Frontend    │
               │       (Static Files)       │
               └──────────────┬─────────────┘
                              │
                 HTTPS / API Calls
                              │
               ┌──────────────▼─────────────┐
               │          Render            │
               │         (Backend)          │
               │                            │
               │   Spring Boot Application  │
               │          (Docker)          │
               └────────────────────────────┘
```

### 🎯 Where I Struggled: Docker on Render

#### 🧱 Initial Docker Issues on Render

**Problem 1: Docker image too large for Render's free tier**

```dockerfile
# ❌ PROBLEMATIC - Using heavy base image
FROM openjdk:17-jdk-slim  # Still too big for Render
COPY . .
RUN ./gradlew build
# Result: Image > 1GB → Render deployment failures
```

**Problem 2: Build timeouts on Render**

```dockerfile
# 🕒 Build taking too long
RUN ./gradlew clean build -x test

# ⚠️ Render free tier has a 15-minute build timeout
# Complex dependencies and Gradle downloads caused frequent timeouts
```

**Problem 3: Port Configuration Issues**

```dockerfile
EXPOSE 8080  # Default Spring Boot port

# ❌ Problem:
# Render dynamically assigns ports at runtime (via the PORT environment variable),
# so hardcoding port 8080 caused deployment failures.

# ✅ Correct Approach:
ENV PORT=8080
CMD ["sh", "-c", "java -jar build/libs/app.jar --server.port=$PORT"]
```

### ✅ The Working Solution

**Final Dockerfile that worked:**

```dockerfile
FROM openjdk:24-jdk-slim  # Lighter base image

WORKDIR /app

COPY . .

# Make gradlew executable and build without tests
RUN chmod +x gradlew && ./gradlew clean build -x test

# Debug: List JAR files to verify build
RUN ls -la build/libs/

# Expose port matching Spring Boot server.port
EXPOSE 10000

# Use the exact JAR filename
CMD ["java", "-jar", "build/libs/authservice-0.0.1-SNAPSHOT.jar"]
```

### 🔧 Configuration Challenges & Solutions

#### 1. Frontend Configuration (Hostinger)

**Problem:** Configuring React Vite for production with an external backend API

**Solution:** Use environment variables and proper build configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://your-backend.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});

// Environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-backend.onrender.com';

// api-config.js
export const api = {
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased for Render's cold starts
};
```

#### 2. Backend Configuration (Render)

**Problem:** Spring Boot configuration for cloud deployment

**Solution:** `application.properties` for production

```properties
# Render-specific configuration
server.port=10000
server.address=0.0.0.0

# CORS for Hostinger frontend
spring.web.cors.allowed-origins=https://your-domain.hostinger.com
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true

# Database configuration (Render provides DATABASE_URL)
spring.datasource.url=${JDBC_DATABASE_URL:jdbc:postgresql://localhost:5432/mydb}
spring.datasource.username=${JDBC_DATABASE_USERNAME:user}
spring.datasource.password=${JDBC_DATABASE_PASSWORD:pass}

# Render health check endpoint
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=always
```

#### 3. Cross-Origin Resource Sharing (CORS)

**Where I Struggled:**  
CORS errors between Hostinger (React frontend) and Render (Spring Boot backend).

**Solution:** Comprehensive CORS configuration using a dedicated `CorsConfig` class.

```java
@Configuration
@EnableWebMvc
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "https://starwashph.com",
                    "https://www.starwashph.com",
                    "http://localhost:3000"  // For local development
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

### 🚀 Deployment Process

#### Frontend Deployment to Hostinger

**Steps that worked:**

1. **Build the React app:**

```bash
npm run build
# Creates 'dist' folder with static files
```

#### Upload Frontend to Hostinger

1. **Connect via FTP/File Manager**
2. **Upload all contents of `dist` folder to `public_html`**
3. **Ensure `index.html` is in the root directory**
4. **Configure Hostinger:**
   - Set up custom domain (if needed)
   - Configure SSL certificate
   - Set up redirects from HTTP to HTTPS

---

#### Backend Deployment to Render

**Steps that worked:**

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure Build Settings:

```text
Build Command: chmod +x gradlew && ./gradlew clean build -x test
Start Command: java -jar build/libs/authservice-0.0.1-SNAPSHOT.jar
```

#### Environment Variables

Set the following environment variables on Render:

```env
JDBC_DATABASE_URL=postgresql://...
JDBC_DATABASE_USERNAME=user
JDBC_DATABASE_PASSWORD=pass
SPRING_PROFILES_ACTIVE=prod
```

### 🎓 Key Learning Points

#### 1. Understanding Hosting Types
**Learned:** Different hosting solutions for different needs:

- **Web Hosting:** Static files, PHP, basic websites
- **VPS:** Full control, any runtime environment
- **PaaS (Render):** Simplified deployment for specific runtimes

#### 2. Docker Optimization for Cloud
**Where I Improved:**

```dockerfile
# BAD - Heavy image
FROM openjdk:17

# GOOD - Lighter image
FROM openjdk:24-jdk-slim

# BAD - Copy everything first
COPY . .
RUN ./gradlew build

# GOOD - Use Docker layer caching
COPY build.gradle settings.gradle ./
COPY gradle/ gradle/
COPY gradlew ./
RUN ./gradlew dependencies --no-daemon
COPY src/ src/
RUN ./gradlew build -x test
```

#### 3. Environment-Specific Configuration
**Learned:** Separate configurations for different environments:

```java
// application-dev.properties
server.port=8080
spring.datasource.url=jdbc:h2:mem:testdb

// application-prod.properties  
server.port=10000
spring.datasource.url=${JDBC_DATABASE_URL}
```

#### 4. Handling Cold Starts
**Challenge:** Render free tier has cold starts

**Solution:** Optimized startup and health checks:

```java
@RestController
public class HealthController {
    
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
    
    @GetMapping("/api/ready")
    public String ready() {
        return "Application is ready";
    }
}
```

#### 🔧 Troubleshooting Common Issues

1. **Build Failures on Render**  
**Problem:** Gradle build timeout  

**Solution:** Optimize build process:

```dockerfile
# Use Gradle daemon and skip tests
RUN ./gradlew clean build -x test --no-daemon --parallel

# Use build cache
RUN --mount=type=cache,target=/root/.gradle ./gradlew build -x test
```

2. **Database Connection Issues**  
**Problem:** Render PostgreSQL connection strings  

**Solution:** Proper environment variable handling:

```java
@Configuration
public class DatabaseConfig {
    
    @Value("${JDBC_DATABASE_URL:}")
    private String jdbcDatabaseUrl;
    
    @Bean
    @Primary
    public DataSource dataSource() {
        if (jdbcDatabaseUrl.contains("postgres")) {
            // Parse Render's DATABASE_URL format
            return parseRenderDatabaseUrl(jdbcDatabaseUrl);
        }
        // Default configuration
        return DataSourceBuilder.create().build();
    }
}
```

3. **File Path Issues**  
**Problem:** Different file systems between local and cloud  

**Solution:** Use environment-agnostic paths:

```java
@Service
public class FileStorageService {
    
    @Value("${file.upload-dir:/tmp/uploads}")
    private String uploadDir;
    
    public String getStoragePath() {
        return uploadDir;
    }
}
```

📝 Best Practices Discovered

1. **Multi-Environment Setup**

```bash
# Local development
SPRING_PROFILES_ACTIVE=dev

# Production on Render  
SPRING_PROFILES_ACTIVE=prod

# Use different configuration files
src/
├── main/
│   ├── resources/
│   │   ├── application.properties
│   │   ├── application-dev.properties
│   │   └── application-prod.properties
```

2. **Monitoring and Logging**

```java
@SpringBootApplication
public class Application {
    
    private static final Logger logger = LoggerFactory.getLogger(Application.class);
    
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        logger.info("Application started successfully on port: {}", 
                   Environment.getProperty("server.port"));
    }
}
```

3. **Security Considerations**

```properties
# Production security
server.ssl.enabled=false  # Let Render handle SSL
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized
```

