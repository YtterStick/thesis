FROM openjdk:21-jdk-slim

WORKDIR /app

COPY backend/archservice/ .

RUN chmod +x gradlew && ./gradlew clean build -x test

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "build/libs/archservice-0.0.1-SNAPSHOT.jar"]