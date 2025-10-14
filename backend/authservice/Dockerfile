FROM openjdk:24-jdk-slim

WORKDIR /app

# Copy everything
COPY . .

# Build the Spring Boot app
RUN cd backend/authservice && chmod +x gradlew && ./gradlew clean build -x test

EXPOSE 10000

# Run from the Spring Boot directory
WORKDIR /app/backend/authservice
CMD ["java", "-jar", "build/libs/*.jar"]