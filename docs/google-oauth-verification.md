# Google OAuth Verification — JobTrack

Use this checklist when submitting JobTrack for Google OAuth verification.

## Production URLs after custom domain is connected

Replace `YOUR_DOMAIN` with the custom domain you own and verify in Google Search Console.

- Homepage: `https://YOUR_DOMAIN/`
- Privacy Policy: `https://YOUR_DOMAIN/privacy`
- Terms of Service: `https://YOUR_DOMAIN/terms`
- Google sign-in callback: `https://YOUR_DOMAIN/login/oauth2/code/google`
- Gmail callback: `https://YOUR_DOMAIN/api/gmail/callback`

The homepage, Privacy Policy and Terms are public and do not require sign-in.

## OAuth scopes used

Normal Google Sign-In:
- `openid`
- `profile`
- `email`

Optional Smart Inbox Sync:
- `https://www.googleapis.com/auth/gmail.readonly`

## Scope justification to paste into Google verification

### gmail.readonly justification

JobTrack is a personal job-application tracking application. Smart Inbox Sync is an optional user-initiated feature that helps users identify job-application status updates in their own Gmail account.

When the user chooses "Connect Gmail", JobTrack requests read-only Gmail access. The application searches recent messages that may relate to job applications and reads limited message metadata and preview data: message ID, internal date, sender, subject and a short snippet. This information is used only to classify job-application events such as Applied, Screening, Interview, Offer or Rejected and to help update the user's private JobTrack workspace.

JobTrack does not send email, delete email, modify email, mark email as read, access attachments, or use Gmail data for advertising. Gmail access is optional and separate from normal Google Sign-In.

Access tokens are kept in the server-side session and are not stored in the application database. JobTrack does not request Gmail refresh tokens for Smart Inbox Sync. Pending email suggestions may temporarily store the message ID, sender, subject and short snippet so the user can review them. After a suggestion is approved or dismissed, the stored sender, subject and snippet are cleared. Users can disconnect Gmail and clear imported Gmail records from the application.

The requested read-only scope is needed because JobTrack must search the user's recent Gmail messages and retrieve metadata/short previews for the messages that may contain job-application updates.

## Short app description

JobTrack is a private job-search workspace that helps users organise job applications, stages, interviews and follow-ups. Its optional Smart Inbox Sync feature can read recent Gmail job-application emails to identify status changes and keep the user's tracker up to date.

## Detailed app description

JobTrack helps job seekers maintain a private record of their applications, stage history, interviews, notes and follow-up tasks. Users authenticate with Google Sign-In.

Smart Inbox Sync is optional. When explicitly connected by the user, JobTrack requests read-only Gmail access and scans recent messages likely to contain job-application updates. It reads only the message ID, date, sender, subject and a short snippet; it does not read attachments or change mailbox content. Clear Applied and Screening updates may be applied automatically when JobTrack can confidently match them to an existing application. Ambiguous messages are shown as Needs review so the user can decide what to do.

## Demo video script

Record one continuous screen recording with the browser address bar visible.

1. Open the public JobTrack homepage while signed out.
2. Show that the page describes the application and the optional Smart Inbox Sync feature.
3. Open the Privacy Policy from the homepage and briefly show the Google/Gmail data sections.
4. Return to JobTrack and sign in with Google.
5. Open Settings → Smart Inbox Sync.
6. Show the text explaining that JobTrack reads sender, subject and a short preview and does not send/delete/mark messages as read.
7. Click Connect Gmail.
8. On Google's authorization screen, show the Gmail read-only permission requested by JobTrack.
9. Accept the permission and return to JobTrack.
10. Click Sync emails.
11. Show an auto-applied Applied/Screening update if available, including the green Auto-applied indicator.
12. Show an ambiguous email under the amber Needs review indicator if available.
13. Open Applications and show that the matched application's stage was updated.
14. Return to Settings and click Disconnect & clear emails to demonstrate the user's data control.
15. End on the public Privacy Policy or homepage.

Do not reveal OAuth client secrets, database credentials or other private environment variables in the recording.

## Verification form notes

- App name: JobTrack
- User type: External
- Publishing status: In production
- Contact/developer email: km.sarth@gmail.com
- Feature using restricted Google data: Smart Inbox Sync
- Data access is optional and user initiated.
- Gmail data is not used for advertising or sold.
- The app uses a server-side backend to process Gmail data.

## Important restricted-scope note

`gmail.readonly` is a restricted Gmail scope. Because JobTrack processes Gmail data through its server, Google may require a third-party security assessment in addition to OAuth verification. Complete domain and brand verification first, submit the OAuth verification request, and follow Google's instructions for any required security assessment.
