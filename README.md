# JobTrack

A private job application tracker using React (JavaScript), Spring Boot, Spring Security and MySQL.

## Features

- Google sign-in with server-side sessions
- Applications, stage history, notes, interviews and follow-ups saved per user
- Overview with summary cards and an application pipeline
- Search, filters, list/board views and mobile navigation
- Light/dark theme saved in the browser

Gmail inbox access and automated status suggestions are **not implemented yet**. No Gmail permissions are requested. New accounts start with an empty workspace. Sample data exists only in automated tests.

## Run locally

Requirements: Java 17+, Maven 3.6.3+, Node.js 22.13+, and Google OAuth credentials. MySQL is optional for the first local run.

### Google OAuth setup

Create a **Web application** OAuth client in your Google Cloud project. Configure your consent screen and add test users if your OAuth app is in testing mode.

Add this exact authorized redirect URI for the Vite development server:

```
http://localhost:5173/login/oauth2/code/google
```

Set the credentials as environment variables in the terminal running Spring Boot. Do not put them in React code or commit them to Git.

PowerShell:

```powershell
$env:GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

The `local` profile uses a persistent H2 database in `backend/data/` so you can start without installing MySQL. It still requires Google sign-in; there is no authentication bypass. The application does not automatically load `.env` files; `backend/.env.example` documents the variable names.

In a second terminal, from the repository root:

```bash
npm ci
npm run dev
```

Open http://localhost:5173. Vite forwards `/api`, `/oauth2` and `/login` to Spring Boot on port 8080. Keep the same hostname throughout sign-in; do not switch between `localhost` and `127.0.0.1`.

### Use MySQL

Create a database named `jobtrack` and a database user with access to it. Set `DB_URL`, `DB_USERNAME` and `DB_PASSWORD`, then run the backend **without** the `local` profile:

```bash
cd backend
mvn spring-boot:run
```

Example JDBC URL: `jdbc:mysql://localhost:3306/jobtrack`. Flyway creates the schema; Hibernate validates it rather than changing it automatically.

## Production build

```bash
npm ci
npm run build
cd backend
mvn clean package
```

The JAR includes the compiled React assets. Run `java -jar target/jobtrack-0.2.0.jar` with database and Google environment variables configured.

For a local JAR run on port 8080, set `FRONTEND_URL=http://localhost:8080` and register `http://localhost:8080/login/oauth2/code/google` in Google Cloud.

A multi-stage `Dockerfile` is included for a single deployment serving both React and the API. For HTTPS hosting:

- Set `FRONTEND_URL` to your public HTTPS origin.
- Set `COOKIE_SECURE=true` and configure MySQL credentials.
- Register `https://YOUR_HOST/login/oauth2/code/google` as the Google redirect URI.
- If your hosting provider terminates TLS at a trusted proxy, set `SERVER_FORWARD_HEADERS_STRATEGY=framework`. The proxy must overwrite forwarded headers.

Sessions are stored in the running application, so users sign in again after a restart. Run one application instance until a shared session store is added. No hosting service is configured or deployed by this repository.

## Structure

- `src/App.jsx`: workspace state and API actions
- `src/components`: screens, forms and reusable UI
- `src/lib/api.js`: requests, CSRF tokens and API errors
- `backend/src/main/java/com/jobtrack/config`: login, sessions and validation errors
- `backend/src/main/java/com/jobtrack/workspace`: controllers, service, repositories, entities and request/response records
- `backend/src/main/resources/db/migration`: versioned SQL schema
- `tests`: frontend workflow tests with a mock API

The backend gets the owner from the authenticated Google subject, never from the request body. Every record lookup checks that owner. Related interviews and follow-ups are checked against an owned application. Writes require Spring Security's CSRF token. Login uses only `openid`, `profile` and `email` scopes.

## Checks

```bash
npm run lint
npm test
npm run build
npm run format:check
cd backend
mvn test
```

Backend integration tests use H2 and simulated OIDC users. They test authentication, CSRF, persistence, user isolation, history and input validation. Frontend tests use a simulated DOM. Real Google sign-in, MySQL deployment and actual phone rendering require environment-specific checks.
