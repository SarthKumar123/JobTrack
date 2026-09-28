import { Check, ArrowLeft } from "lucide-react";

import { Brand } from "@/components/common";

export default function SignIn({ authNotice, setAuthNotice, go }) {
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
        <button className="google-btn" onClick={() => setAuthNotice(true)}>
          <span className="google-g">G</span>Continue with Google
        </button>
        <p className="signin-help">
          Your workspace is personal. Your job search stays yours.
        </p>
        {authNotice && (
          <div className="auth-note" role="status">
            Google sign-in will be connected with the backend. This version is a
            UI preview.
          </div>
        )}
        <button className="text-btn" onClick={() => go("Overview")}>
          <ArrowLeft size={16} /> Back to design preview
        </button>
      </div>
    </main>
  );
}
