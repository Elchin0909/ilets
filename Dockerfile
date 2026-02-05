# --- build stage ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# cache uchun avval dependency
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw

# endi source
COPY src ./src
RUN ./mvnw -q -DskipTests package || mvn -q -DskipTests package

# --- run stage ---
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
