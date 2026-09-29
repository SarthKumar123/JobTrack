import InboxSync from "@/components/InboxSync";
import { ArrowUpRight } from "lucide-react";

import { Switch } from "@/components/ui/switch";

export default function Settings({
  theme,
  changeTheme,
  profile,
  logout,
  apps,
  onApproved,
}) {
  return (
    <div className="settings-grid">
      <InboxSync apps={apps} onApproved={onApproved} />
      <article className="panel settings-card appearance-card">
        <div>
          <h2>Appearance</h2>
          <p>Choose a light or dark workspace. Saved on this browser.</p>
        </div>
        <div className="theme-setting">
          <label htmlFor="dark-mode">
            Dark mode
            <span>
              {theme === "dark" ? "Dark background" : "Light background"}
            </span>
          </label>
          <Switch
            id="dark-mode"
            checked={theme === "dark"}
            onCheckedChange={changeTheme}
          />
        </div>
      </article>
      <article className="panel settings-card">
        <h2>Your profile</h2>
        <div className="settings-profile">
          <span className="avatar">{(profile.name || "User").slice(0, 1)}</span>
          <div>
            <strong>{profile.name}</strong>
            <p>{profile.email}</p>
          </div>
        </div>
        <label>
          Name
          <input value={profile.name || ""} readOnly />
        </label>
        <label>
          Time zone
          <input value="Asia/Kolkata (IST)" readOnly />
        </label>
        <p className="muted">Signed in with your Google account.</p>
      </article>
      <article className="panel settings-card">
        <h2>Your account</h2>
        <p>
          Your applications, interviews and follow-ups are saved privately to
          your account.
        </p>
        <button className="secondary" onClick={logout}>
          Sign out <ArrowUpRight size={16} />
        </button>
      </article>
    </div>
  );
}
