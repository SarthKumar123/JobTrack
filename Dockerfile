FROM node:22-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/index.html frontend/vite.config.js frontend/postcss.config.js frontend/jsconfig.json ./
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build

FROM maven:3.9.9-eclipse-temurin-17 AS backend
WORKDIR /build
COPY backend ./backend
COPY --from=frontend /build/frontend/dist ./frontend/dist
RUN mvn -B -f backend/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend /build/backend/target/jobtrack-0.2.0.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
