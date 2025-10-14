FROM openjdk:24-jdk-slim

WORKDIR /app

COPY . .

RUN chmod +x gradlew && ./gradlew clean build -x test

# List JAR files for debugging
RUN ls -la build/libs/

EXPOSE 10000

# Use the exact JAR filename
CMD ["java", "-jar", "build/libs/authservice-0.0.1-SNAPSHOT.jar"]