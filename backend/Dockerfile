# ── Build Stage ──────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Cache Maven dependencies separately (layer cache optimization)
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# Build the application
COPY src ./src
RUN mvn package -DskipTests -B -q

# ── Runtime Stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy the built JAR
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Healthcheck: Actuator health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM flags:
#  -XX:+UseContainerSupport          → respect Docker memory limits
#  -XX:MaxRAMPercentage=75.0         → use 75% of container RAM for heap
#  -XX:+UseG1GC                      → G1 garbage collector (best for services)
#  -Djava.security.egd=...           → faster startup (random seed)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
