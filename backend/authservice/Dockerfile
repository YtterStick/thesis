FROM openjdk:24-jdk-slim

WORKDIR /app

# Copy everything from current directory (backend/authservice/)
COPY . .

# Build the application
RUN chmod +x gradlew && ./gradlew clean build -x test

EXPOSE 10000

# Run the application
CMD ["java", "-jar", "build/libs/*.jar"]