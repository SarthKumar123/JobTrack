import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import SignIn from "@/components/SignIn";

export default function Session({ children }) {
  const [session, setSession] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const profile = await api("/api/me", { signal: controller.signal });
        const workspace = await api("/api/workspace", {
          signal: controller.signal,
        });
        setSession({ status: "ready", profile, workspace });
      } catch (error) {
        if (controller.signal.aborted) return;
        setSession({ status: error.status === 401 ? "signed-out" : "error" });
      }
    }
    load();
    return () => controller.abort();
  }, [attempt]);

  if (session.status === "signed-out") return <SignIn />;
  if (session.status !== "ready") {
    return (
      <main className="empty" role="status">
        <h1>
          {session.status === "loading"
            ? "Opening your workspace…"
            : "Could not connect to JobTrack"}
        </h1>
        {session.status === "error" && (
          <>
            <p>Check that the backend is running, then try again.</p>
            <button
              className="primary"
              onClick={() => {
                setSession({ status: "loading" });
                setAttempt((value) => value + 1);
              }}
            >
              Retry
            </button>
          </>
        )}
      </main>
    );
  }
  return children(session, () => setSession({ status: "signed-out" }));
}
