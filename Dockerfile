FROM node:22-alpine AS frontend
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js postcss.config.js jsconfig.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM maven:3.9.9-eclipse-temurin-17 AS backend
WORKDIR /build
COPY backend ./backend
COPY --from=frontend /build/dist ./dist
RUN mvn -B -f backend/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend /build/backend/target/jobtrack-0.2.0.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
