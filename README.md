# JobTrack

A private job application tracker using React (JavaScript), Spring Boot, Spring Security and MySQL.

## Features

- Google sign-in with server-side sessions
- Applications, stage history, notes, interviews and follow-ups saved per user
- Overview with summary cards and an application pipeline
- Search, filters, list/board views and mobile navigation
- Light/dark theme saved in the browser

Smart Inbox Sync is available in **Settings** as an optional, read-only Gmail connection. Ordinary Google sign-in still requests only profile, email and OpenID permissions. New accounts start with an empty workspace. Sample data exists only in automated tests.

## Run locally

Requirements: Java 17+, Maven 3.6.3+, Node.js 22.22.2+ (22.x), 24.15+ (24.x), or 26+, and Google OAuth credentials. MySQL is optional for the first local run.

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

### Run the backend in Spring Tools for Eclipse (STS)

Import `backend/` using **File > Import > Maven > Existing Maven Projects**. Open **Run > Run Configurations > Spring Boot App > JobTrackApplication**.

- In **Environment**, add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with values from the same OAuth client, without quotes.
- In **Arguments > Program arguments**, enter `--spring.profiles.active=local`.
- Click **Apply**, then **Run**. Wait for `Started JobTrackApplication` before opening the frontend.
- Restart this configuration after changing environment variables. Do not commit credentials or shared launch configurations containing them.

### Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. Vite forwards `/api`, `/oauth2` and `/login` to Spring Boot on port 8080. Keep the same hostname throughout sign-in; do not switch between `localhost` and `127.0.0.1`.

### Enable Smart Inbox Sync locally

1. In the same Google Cloud project as your OAuth client, enable **Gmail API** under **APIs & Services > Library**.
2. Under **Google Auth Platform > Data Access**, add `https://www.googleapis.com/auth/gmail.readonly`. Keep the app in testing while developing and add your Google account under **Audience > Test users**.
3. Add a second authorized redirect URI to your **Web application** OAuth client: `http://localhost:5173/api/gmail/callback`. Keep the existing `/login/oauth2/code/google` URI for normal sign-in.
4. Start the backend and frontend, sign in, open **Settings > Smart Inbox Sync**, and choose **Connect Gmail**. Grant read-only access using the same Google account you used to sign in.
5. Click **Sync emails** and review each suggestion. Select an existing application and a stage, or enter a company and role to create one. Nothing changes until you click Approve. Dismiss ignores that email on later syncs.

The scan searches the last 30 days, excludes spam, trash and sent mail, and reads at most 50 matching emails per click. A notice appears if Google reports more results; this version does not paginate through older results. It reads message metadata and short snippets only, not attachments or full bodies. English keyword rules classify Applied, Screening, Interview, Offer and Rejected; previews can omit important context, so check the original email. Company and role are prefilled from explicit application phrases when unambiguous. Work mode is prefilled only from an explicit work-mode label. Unclear or conflicting fields stay blank and all suggestions remain editable. Details are derived when suggestions are loaded, so existing pending emails also benefit. Existing applications are selected explicitly. Interview dates are not extracted automatically.

OAuth uses a single-use, ten-minute state and PKCE, verifies that the authorized Google subject matches the signed-in user, and checks the granted scope. Access tokens stay in the server session and expire; no refresh tokens or background jobs are used. Signing out or restarting the backend clears that session's access. Reconnect when access expires. Tokens never reach React or the database.

Pending subjects, senders and previews are stored per user. Approving or dismissing clears those text fields and retains message IDs to prevent duplicate suggestions. **Disconnect & clear emails** removes this session's token and all imported suggestions/review history for the account; applications already created remain. Another active session can still be connected. To revoke Google's grant across sessions, use [Google account connections](https://myaccount.google.com/connections). After clearing review history, a later sync can suggest the same emails again.

Public Gmail access is not deployment-ready merely because local testing works. `gmail.readonly` is a restricted scope: public use may require OAuth verification and a security assessment for server-side processing, subject to Google's exceptions. Review [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes) and [restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification) before making Gmail integration available to the public. Real Gmail consent and API calls must be tested with your configured Google project; automated tests use a fake Gmail client.

### Use MySQL

Create a database named `jobtrack` and a database user with access to it. Set `DB_URL`, `DB_USERNAME` and `DB_PASSWORD`, then run the backend **without** the `local` profile:

```bash
cd backend
mvn spring-boot:run
```

Example JDBC URL: `jdbc:mysql://localhost:3306/jobtrack`. Flyway creates the schema; Hibernate validates it rather than changing it automatically.

## Production build

```bash
cd frontend
npm ci
npm run build
cd ../backend
mvn clean package
```

The JAR includes the compiled React assets. Run `java -jar target/jobtrack-0.2.0.jar` with database and Google environment variables configured.

For a local JAR run on port 8080, set `FRONTEND_URL=http://localhost:8080` and register `http://localhost:8080/login/oauth2/code/google` in Google Cloud.

A multi-stage `Dockerfile` is included for a single deployment serving both React and the API. For HTTPS hosting:

- Set `FRONTEND_URL` to your public HTTPS origin.
- Set `COOKIE_SECURE=true` and configure MySQL credentials.
- Register `https://YOUR_HOST/login/oauth2/code/google` for sign-in and `https://YOUR_HOST/api/gmail/callback` for Gmail connection.
- If your hosting provider terminates TLS at a trusted proxy, set `SERVER_FORWARD_HEADERS_STRATEGY=framework`. The proxy must overwrite forwarded headers.

Sessions are stored in the running application, so users sign in again after a restart. Run one application instance until a shared session store is added. No hosting service is configured or deployed by this repository.

## Structure

React lives in `frontend/`; Spring Boot lives in `backend/`. Run npm commands inside `frontend/`.

- `frontend/src/App.jsx`: workspace state and API actions
- `frontend/src/components`: screens, forms and reusable UI
- `frontend/src/lib/api.js`: requests, CSRF tokens and API errors
- `backend/src/main/java/com/jobtrack/gmail`: Gmail connection, read-only API client, matching rules and reviewed suggestions
- `backend/src/main/java/com/jobtrack/config`: login, sessions and validation errors
- `backend/src/main/java/com/jobtrack/workspace`: controllers, service, repositories, entities and request/response records
- `backend/src/main/resources/db/migration`: versioned SQL schema
- `frontend/tests`: frontend workflow tests with a mock API

The backend gets the owner from the authenticated Google subject, never from the request body. Every record lookup checks that owner. Related interviews and follow-ups are checked against an owned application. Writes require Spring Security's CSRF token. Login uses only `openid`, `profile` and `email` scopes.

## Checks

```bash
cd frontend
npm run lint
npm test
npm run build
npm run format:check
cd ../backend
mvn test
```

Backend integration tests use H2 and simulated OIDC users. They test authentication, CSRF, persistence, user isolation, history and input validation. Frontend tests use a simulated DOM. Gmail tests cover OAuth state, account matching, denied scope, expiry, deduplication, approval validation, ownership and disconnect. Real Google/Gmail flows, MySQL deployment and actual phone rendering require environment-specific checks.
