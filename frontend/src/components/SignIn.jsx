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
          Your applications, interviews and next steps.
          <br />
          All in one place.
        </p>
        <div className="signin-track">
          <span>
            <Check size={18} /> Stay organised
          </span>
          <span>
            <Check size={18} /> Show up prepared
          </span>
          <span>
            <Check size={18} /> Keep moving forward
          </span>
        </div>
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
          Your workspace is personal. Your job search stays yours.
        </p>
        <p className="signin-legal">
          <a href="/privacy">Privacy Policy</a>
          <span aria-hidden="true"> · </span>
          <a href="/terms">Terms of Service</a>
        </p>
        <nav className="signin-legal" aria-label="Legal">
          <a href="/privacy">Privacy Policy</a>
          <span>·</span>
          <a href="/terms">Terms of Service</a>
        </nav>
        {new URLSearchParams(window.location.search).get("login") ===
          "failed" && (
          <p role="alert">Google sign-in failed. Please try again.</p>
        )}
      </div>
    </main>
  );
}
