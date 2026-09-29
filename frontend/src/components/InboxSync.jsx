import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { stages } from "@/lib/constants";

const outcomes = {
  connected: "Gmail connected. You can now sync recent emails.",
  denied:
    "Gmail permission was not granted. Your tracker still works normally.",
  "wrong-account": "Choose the same Google account you use for JobTrack.",
  expired: "The connection request expired. Please connect again.",
  failed:
    "Could not connect Gmail. Check your Google OAuth settings and retry.",
};

export default function InboxSync({ apps, onApproved }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    () =>
      outcomes[new URLSearchParams(window.location.search).get("gmail")] || "",
  );
  useEffect(() => {
    const controller = new AbortController();
    api("/api/gmail", { signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    const url = new URL(window.location.href);
    if (url.searchParams.has("gmail")) {
      url.searchParams.delete("gmail");
      window.history.replaceState(null, "", url);
    }
    return () => controller.abort();
  }, []);

  async function act(action) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  const reload = async () => setData(await api("/api/gmail"));
  const connect = () =>
    act(async () => {
      const result = await api("/api/gmail/connect", { method: "POST" });
      window.location.assign(result.url);
    });
  const sync = () =>
    act(async () => {
      const result = await api("/api/gmail/sync", { method: "POST" });
      await reload();
      setMessage(
        `${result.added} new suggestions found.${result.limited ? " Only the first 50 matching emails were scanned." : ""}`,
      );
    });
  const approve = (suggestion, body) =>
    act(async () => {
      const saved = await api(
        `/api/gmail/suggestions/${suggestion.id}/approve`,
        { method: "POST", body },
      );
      onApproved(saved);
      setData((current) => ({
        ...current,
        suggestions: current.suggestions.filter((s) => s.id !== suggestion.id),
      }));
      setMessage(
        "Application saved. The reviewed email will not be suggested again.",
      );
    });
  const dismiss = (id) =>
    act(async () => {
      await api(`/api/gmail/suggestions/${id}/dismiss`, { method: "POST" });
      setData((current) => ({
        ...current,
        suggestions: current.suggestions.filter((s) => s.id !== id),
      }));
    });
  const disconnect = () =>
    act(async () => {
      await api("/api/gmail", { method: "DELETE" });
      setData({ connected: false, suggestions: [] });
      setMessage(
        "Disconnected in this session and deleted imported email details and review history. Your applications are kept.",
      );
    });

  return (
    <article className="panel settings-card inbox-sync">
      <h2>Smart Inbox Sync</h2>
      <p>
        Find application updates in Gmail, then review them before changing your
        tracker.
      </p>
      <p>
        Scans up to 50 matching emails from the last 30 days. Reads sender,
        subject and a short preview. It never sends, deletes or marks emails as
        read.
      </p>
      <p>
        Gmail access lasts for this session until the access token expires.
        Connect again when needed. Pending email previews are saved privately
        until reviewed or cleared.
      </p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <div className="inbox-actions">
        <button className="secondary" disabled={busy} onClick={connect}>
          {data?.connected ? "Reconnect Gmail" : "Connect Gmail"}
        </button>
        {data?.connected && (
          <button className="primary" disabled={busy} onClick={sync}>
            {busy ? "Working…" : "Sync emails"}
          </button>
        )}
        {data && (data.connected || data.suggestions.length > 0) && (
          <button className="secondary" disabled={busy} onClick={disconnect}>
            Disconnect & clear emails
          </button>
        )}
        {!data && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => act(reload)}
          >
            Reload connection
          </button>
        )}
      </div>
      <p>
        To revoke Google's permission across devices, use{" "}
        <a
          href="https://myaccount.google.com/connections"
          target="_blank"
          rel="noreferrer"
        >
          Google account connections
        </a>
        . Clearing review history means those emails can appear again after
        reconnecting.
      </p>
      {data && <h3>Suggestions to review ({data.suggestions.length})</h3>}
      {data?.suggestions.length === 0 && (
        <p>No pending suggestions. Sync your inbox to look for updates.</p>
      )}
      {data?.suggestions.map((suggestion) => (
        <Suggestion
          key={suggestion.id}
          suggestion={suggestion}
          apps={apps}
          busy={busy}
          approve={approve}
          dismiss={dismiss}
        />
      ))}
    </article>
  );
}

function Suggestion({ suggestion, apps, busy, approve, dismiss }) {
  const [appId, setAppId] = useState("");
  const [stage, setStage] = useState(suggestion.stage);
  const current = apps.find((app) => app.id === appId);
  function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    approve(suggestion, {
      stage,
      ...(appId
        ? { appId }
        : {
            application: {
              company: values.get("company").trim(),
              role: values.get("role").trim(),
              location: "",
              mode: values.get("mode"),
              stage,
              date: suggestion.date,
              url: "",
              notes: "",
              resume: "",
            },
          }),
    });
  }
  return (
    <form className="inbox-suggestion" onSubmit={submit}>
      <h3>{suggestion.subject || "No subject"}</h3>
      <p>
        {suggestion.sender} · {suggestion.date}
      </p>
      <p>{suggestion.snippet}</p>
      <p>
        <strong>Suggested: {suggestion.stage}.</strong> {suggestion.reason}{" "}
        Company, role and stage suggestions can be wrong. Check and edit them
        before approving; unclear fields are left blank.
      </p>
      <fieldset disabled={busy}>
        <label>
          Application
          <select value={appId} onChange={(e) => setAppId(e.target.value)}>
            <option value="">Create a new application</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.company} — {app.role}
              </option>
            ))}
          </select>
        </label>
        {!appId && (
          <div className="inbox-fields">
            <label>
              Company
              <input
                name="company"
                required
                maxLength={100}
                defaultValue={suggestion.company || ""}
              />
            </label>
            <label>
              Role
              <input
                name="role"
                required
                maxLength={150}
                defaultValue={suggestion.role || ""}
              />
            </label>
            <label>
              Work mode
              <select name="mode" required defaultValue={suggestion.mode || ""}>
                <option value="" disabled>
                  Select work mode
                </option>
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
              </select>
            </label>
          </div>
        )}
        <label>
          Stage to save
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            {stages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {current && (
          <p>
            This changes {current.company} — {current.role} from {current.stage}{" "}
            to {stage}. Check that this email is newer than your last update.
          </p>
        )}
        <div className="inbox-actions">
          <button className="primary" type="submit">
            {appId ? "Approve stage change" : "Approve new application"}
          </button>
          <button
            className="secondary"
            type="button"
            onClick={() => dismiss(suggestion.id)}
          >
            Dismiss
          </button>
        </div>
      </fieldset>
    </form>
  );
}
