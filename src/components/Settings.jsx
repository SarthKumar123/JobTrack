import { ArrowUpRight } from "lucide-react";

import { Switch } from "@/components/ui/switch";

export default function Settings({
  theme,
  changeTheme,
  setPage,
  setAuthNotice,
}) {
  return (
    <div className="settings-grid">
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
          <span className="avatar">SK</span>
          <div>
            <strong>Sarth Kumar</strong>
            <p>Sample profile</p>
          </div>
        </div>
        <label>
          Name
          <input value="Sarth Kumar" readOnly />
        </label>
        <label>
          Time zone
          <input value="Asia/Kolkata (IST)" readOnly />
        </label>
        <p className="muted">
          Your Google profile will be used when sign-in is connected.
        </p>
      </article>
      <article className="panel settings-card">
        <h2>Design preview</h2>
        <p>
          You’re exploring sample applications. Changes last until you refresh
          this page.
        </p>
        <button
          className="secondary"
          onClick={() => {
            setPage("Sign in");
            setAuthNotice(false);
          }}
        >
          Preview Google sign-in <ArrowUpRight size={16} />
        </button>
        <hr />
        <h3>Your account</h3>
        <p>
          Account deletion and saved preferences will be available with the
          backend.
        </p>
      </article>
    </div>
  );
}
