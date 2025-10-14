# Build stage
FROM openjdk:24-jdk-slim as builder
WORKDIR /app

# Copy from the backend/authservice directory
COPY backend/authservice/ .

RUN chmod +x gradlew && ./gradlew clean build -x test

# Runtime stage
FROM openjdk:24-jdk-slim
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 10000
CMD ["java", "-jar", "app.jar"]