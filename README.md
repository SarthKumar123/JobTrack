# JobTrack

A job application tracker built with React, JavaScript, Vite and Tailwind CSS.

## Current scope

This is a **frontend prototype with sample data**. Google sign-in, Gmail sync, a Spring Boot backend and a database are planned, not implemented. Application, interview and follow-up changes are held in memory and reset when the page reloads. The light/dark preference is saved in your browser.

## Features

- Overview with summary cards and an application pipeline
- Application list and board, search and filters
- Add applications, edit stages and notes, and view stage history
- Schedule interviews and manage follow-up tasks
- Light/dark theme in Settings
- Responsive layout and mobile navigation

The demo uses September 2026 dates. Company names and sample roles illustrate the interface; they are not verified vacancies.

## Run on your PC

Install Node.js 22.13 or newer. Extract this folder, open a terminal inside it, and run:

```bash
npm ci
npm run dev
```

Open the local URL printed in the terminal (usually http://localhost:5173).

To create and preview the production build:

```bash
npm run build
npm run preview
```

## Upload to the empty GitHub repository

If the repository is still empty, run these commands from this folder after installing Git:

```bash
git init
git add .
git commit -m "Add JobTrack frontend"
git branch -M main
git remote add origin https://github.com/SarthKumar123/JobTrack.git
git push -u origin main
```

Sign in to your own GitHub account when Git requests authentication. If the remote already has files, clone it first and copy these project files into the clone before committing. Do not force-push over existing work.

## Project structure

- `src/App.jsx`: shared application state and screen navigation
- `src/components`: screens, forms, application details and reusable UI
- `src/data/demo.js`: clearly separated sample data
- `src/hooks`: theme persistence and mobile detection
- `src/lib`: date formatting and CSS class utilities
- `src/index.css`: application layout and themes
- `tests/App.test.jsx`: main user workflow checks

## Checks

```bash
npm run lint
npm test
npm run build
npm run format:check
```

The automated workflow tests cover pipeline filtering, adding an application, changing its stage, linking an interview, completing follow-ups, theme persistence, invalid links and mobile menu navigation. They use a simulated DOM; actual phone rendering and Windows installation still need manual checks.

## Next steps

Build a Spring Boot API and database, add Google OAuth login and per-user data, then add optional Gmail read-only sync with user-reviewed status suggestions. This repository contains no Spring code or placeholder backend. Never commit OAuth secrets or email tokens to the frontend.
