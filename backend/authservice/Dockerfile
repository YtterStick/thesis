FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

COPY . .

RUN chmod +x gradlew && ./gradlew clean build -x test

RUN ls -la build/libs/

EXPOSE 10000

CMD ["java", "-jar", "build/libs/authservice-0.0.1-SNAPSHOT.jar"]