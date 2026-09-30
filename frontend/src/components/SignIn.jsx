import { Check } from "lucide-react";

import { Brand } from "@/components/common";

export default function SignIn() {
  return (
    <main className="signin">
      <div className="signin-story">
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h1>
          A little more clarity.
          <br />A lot more possibility.
        </h1>
        <p>
          JobTrack is a personal job-search workspace for applications,
          interviews, follow-ups and stage history.
        </p>
        <div className="signin-track">
          <span>
            <Check size={18} /> Track every application
          </span>
          <span>
            <Check size={18} /> Stay ready for interviews
          </span>
          <span>
            <Check size={18} /> Keep follow-ups organised
          </span>
        </div>

        <section className="signin-gmail-info" aria-labelledby="gmail-sync-info">
          <h2 id="gmail-sync-info">Optional Smart Inbox Sync</h2>
          <p>
            If you choose to connect Gmail, JobTrack requests read-only Gmail
            access to find recent job-application updates. It uses message dates,
            senders, subjects and short snippets to identify stages such as
            Applied or Screening.
          </p>
          <p>
            JobTrack does not send, delete or modify Gmail messages, does not mark
            them as read, and does not read attachments. Gmail connection is
            optional and can be disconnected from Settings.
          </p>
        </section>
      </div>
      <div className="signin-card">
        <Brand />
        <h2>Welcome to JobTrack</h2>
        <p>Make room for your next opportunity.</p>
        <a className="google-btn" href="/oauth2/authorization/google">
          <span className="google-g" aria-hidden="true">
            G
          </span>
          Continue with Google
        </a>
        <p className="signin-help">
          Google Sign-In uses your basic profile and email to keep your workspace
          private. Gmail access is requested separately only if you enable Smart
          Inbox Sync.
        </p>
        <p className="signin-legal">
          <a href="/privacy">Privacy Policy</a>
          <span aria-hidden="true"> · </span>
          <a href="/terms">Terms of Service</a>
        </p>
        {new URLSearchParams(window.location.search).get("login") ===
          "failed" && (
          <p role="alert">Google sign-in failed. Please try again.</p>
        )}
      </div>
    </main>
  );
}
