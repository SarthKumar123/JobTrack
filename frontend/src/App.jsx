import { useTheme } from "@/hooks/use-theme";
import { getToday } from "@/lib/dates";
import AppSidebar from "@/components/AppSidebar";
import Session from "@/components/Session";
import { api } from "@/lib/api";
import Overview from "@/components/Overview";
import Applications from "@/components/Applications";
import Interviews from "@/components/Interviews";
import FollowUps from "@/components/FollowUps";
import Settings from "@/components/Settings";
import EntryDialog from "@/components/EntryDialog";
import ApplicationDetails from "@/components/ApplicationDetails";
import { useRef, useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function App() {
  return (
    <Session>
      {(session, signOut) => (
        <Workspace
          profile={session.profile}
          initialData={session.workspace}
          signOut={signOut}
        />
      )}
    </Session>
  );
}

function Workspace({ profile, initialData, signOut }) {
  const [theme, changeTheme] = useTheme();
  const [page, setPage] = useState(() =>
    new URLSearchParams(window.location.search).has("gmail")
      ? "Settings"
      : "Overview",
  );
  const [apps, setApps] = useState(initialData.apps);
  const [interviews, setInterviews] = useState(initialData.interviews);
  const [tasks, setTasks] = useState(initialData.tasks);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All stages");
  const [mode, setMode] = useState("All work modes");
  const [view, setView] = useState("list");
  const [modal, setModal] = useState("");
  const [detail, setDetail] = useState(null);
  const [formStage, setFormStage] = useState("Applied");
  const [formMode, setFormMode] = useState("Remote");
  const [related, setRelated] = useState("1");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const name = profile.name || "Your workspace";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function mutate(action) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      if (error.status === 401) signOut();
      else
        toast.error(
          error.message || "Could not save changes. Please try again.",
        );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  function logout() {
    mutate(async () => {
      await api("/api/logout", { method: "POST" });
      signOut();
    });
  }
  const [taskFilter, setTaskFilter] = useState("Pending");
  const app = apps.find((a) => a.id === detail);
  const pending = tasks.filter((t) => !t.done);
  const active = apps.filter(
    (a) => !["Saved", "Rejected", "Withdrawn", "Offer"].includes(a.stage),
  );
  const filtered = apps.filter(
    (a) =>
      (a.company + " " + a.role + " " + a.location)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All stages" || a.stage === filter) &&
      (mode === "All work modes" || a.mode === mode),
  );
  function go(p) {
    setPage(p);
    setQuery("");
    setFilter("All stages");
    setMode("All work modes");
  }
  function add(kind) {
    if (kind !== "application" && apps.length === 0) {
      toast.error("Add an application first.");
      return;
    }
    setFormStage("Applied");
    setFormMode("Remote");
    setRelated(String(apps[0]?.id || ""));
    setModal(kind);
  }
  function changeStage(id, stage) {
    mutate(async () => {
      const saved = await api(`/api/applications/${id}/stage`, {
        method: "PATCH",
        body: { stage },
      });
      setApps((current) =>
        current.map((item) => (item.id === id ? saved : item)),
      );
      toast.success("Application stage updated");
    });
  }

  function saveNotes(id, notes) {
    return mutate(async () => {
      const saved = await api(`/api/applications/${id}/notes`, {
        method: "PUT",
        body: { notes },
      });
      setApps((current) =>
        current.map((item) => (item.id === id ? saved : item)),
      );
      toast.success("Notes saved");
    });
  }

  function deleteApplication(id) {
    return mutate(async () => {
      await api(`/api/applications/${id}`, { method: "DELETE" });
      setApps((current) => current.filter((item) => item.id !== id));
      setInterviews((current) => current.filter((item) => item.appId !== id));
      setTasks((current) => current.filter((item) => item.appId !== id));
      setDetail(null);
      toast.success("Application permanently removed");
    });
  }

  function complete(id) {
    const task = tasks.find((item) => item.id === id);
    mutate(async () => {
      const saved = await api(`/api/tasks/${id}`, {
        method: "PATCH",
        body: { done: !task.done },
      });
      setTasks((current) =>
        current.map((item) => (item.id === id ? saved : item)),
      );
    });
  }

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (field) => String(form.get(field) || "").trim();
    const url = value("url");
    if (url && !/^https?:\/\//i.test(url)) {
      toast.error("Use a link starting with https:// or http://");
      return;
    }
    if (modal === "application" && (!value("company") || !value("role"))) {
      toast.error("Enter a company and role.");
      return;
    }
    if (
      modal !== "application" &&
      (!value("title") || !apps.some((item) => item.id === related))
    ) {
      toast.error("Choose an application and enter a title.");
      return;
    }
    mutate(async () => {
      if (modal === "application") {
        const saved = await api("/api/applications", {
          method: "POST",
          body: {
            company: value("company"),
            role: value("role"),
            location: value("location"),
            mode: formMode,
            stage: formStage,
            date: value("date"),
            url,
            notes: value("notes"),
            resume: value("resume"),
          },
        });
        setApps((current) => [saved, ...current]);
        toast.success("Application added");
      } else if (modal === "interview") {
        const saved = await api("/api/interviews", {
          method: "POST",
          body: {
            appId: related,
            round: value("title"),
            date: value("date"),
            time: value("time"),
            link: url,
            notes: value("notes"),
          },
        });
        setInterviews((current) => [...current, saved]);
        toast.success("Interview scheduled");
      } else {
        const saved = await api("/api/tasks", {
          method: "POST",
          body: { appId: related, title: value("title"), date: value("date") },
        });
        setTasks((current) => [...current, saved]);
        toast.success("Follow-up added");
      }
      setModal("");
    });
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "238px" }}>
      <Toaster theme={theme} position="bottom-right" />
      <AppSidebar
        page={page}
        go={go}
        apps={apps}
        pending={pending}
        profile={profile}
        logout={logout}
      />
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger className="mobile-trigger" />
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>
          <div className="top-right">
            <span className="prototype" role="status">
              {busy ? "Saving…" : "Private workspace"}
            </span>
            <span className="avatar small">{initials}</span>
          </div>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "Overview"
                  ? new Date(getToday() + "T12:00:00")
                      .toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                      .toUpperCase()
                  : "YOUR WORKSPACE"}
              </div>
              <h1>
                {page === "Overview"
                  ? `Let’s move you forward, ${name.split(" ")[0]}.`
                  : page}
              </h1>
              <p>
                {page === "Overview"
                  ? "A clear picture of your job search. A little progress, every day."
                  : page === "Applications"
                    ? "Every opportunity, from the first save to the final offer."
                    : page === "Interviews"
                      ? "Know what’s next. Walk in prepared."
                      : page === "Follow-ups"
                        ? "Small actions that keep your search moving."
                        : "Manage your personal workspace."}
              </p>
            </div>
            {page !== "Settings" && (
              <button
                className="primary"
                onClick={() =>
                  add(
                    page === "Interviews"
                      ? "interview"
                      : page === "Follow-ups"
                        ? "task"
                        : "application",
                  )
                }
              >
                <Plus size={18} />
                {page === "Interviews"
                  ? "Add interview"
                  : page === "Follow-ups"
                    ? "Add follow-up"
                    : "Add application"}
              </button>
            )}
          </div>
          {page === "Overview" && (
            <Overview
              apps={apps}
              active={active}
              interviews={interviews}
              go={go}
              setFilter={setFilter}
            />
          )}
          {page === "Applications" && (
            <Applications
              filtered={filtered}
              query={query}
              setQuery={setQuery}
              filter={filter}
              setFilter={setFilter}
              mode={mode}
              setMode={setMode}
              view={view}
              setView={setView}
              setDetail={setDetail}
            />
          )}
          {page === "Interviews" && (
            <Interviews
              interviews={interviews}
              apps={apps}
              setDetail={setDetail}
            />
          )}
          {page === "Follow-ups" && (
            <FollowUps
              tasks={tasks}
              pending={pending}
              taskFilter={taskFilter}
              setTaskFilter={setTaskFilter}
              apps={apps}
              complete={complete}
            />
          )}
          {page === "Settings" && (
            <Settings
              apps={apps}
              onApproved={(saved) =>
                setApps((current) => [
                  saved,
                  ...current.filter((app) => app.id !== saved.id),
                ])
              }
              theme={theme}
              changeTheme={changeTheme}
              profile={profile}
              logout={logout}
            />
          )}
          <footer className="workspace-footer">
            <span>Make your next move count.</span>
            <span>
              JobTrack <span> / </span> Your career, in motion
            </span>
          </footer>
        </main>
      </div>
      <EntryDialog
        busy={busy}
        modal={modal}
        setModal={setModal}
        submit={submit}
        formMode={formMode}
        setFormMode={setFormMode}
        formStage={formStage}
        setFormStage={setFormStage}
        related={related}
        setRelated={setRelated}
        apps={apps}
      />
      <ApplicationDetails
        key={app?.id || "closed"}
        busy={busy}
        app={app}
        setDetail={setDetail}
        changeStage={changeStage}
        saveNotes={saveNotes}
        deleteApplication={deleteApplication}
        add={add}
        setRelated={setRelated}
      />
    </SidebarProvider>
  );
}
