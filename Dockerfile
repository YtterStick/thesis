FROM openjdk:24-jdk-slim

WORKDIR /app

COPY backend/authservice/ .

RUN chmod +x gradlew && ./gradlew clean build -x test

EXPOSE 10000

CMD ["java", "-jar", "build/libs/*.jar"]