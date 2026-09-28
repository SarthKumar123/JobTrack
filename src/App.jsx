import { useTheme } from "@/hooks/use-theme";
import { getToday } from "@/lib/dates";
import AppSidebar from "@/components/AppSidebar";
import SignIn from "@/components/SignIn";
import Overview from "@/components/Overview";
import Applications from "@/components/Applications";
import Interviews from "@/components/Interviews";
import FollowUps from "@/components/FollowUps";
import Settings from "@/components/Settings";
import EntryDialog from "@/components/EntryDialog";
import ApplicationDetails from "@/components/ApplicationDetails";
import { seeds, seedInterviews, seedTasks } from "@/data/demo";
import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function App() {
  const [theme, changeTheme] = useTheme();
  const [page, setPage] = useState("Overview");
  const [apps, setApps] = useState(seeds);
  const [interviews, setInterviews] = useState(seedInterviews);
  const [tasks, setTasks] = useState(seedTasks);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All stages");
  const [mode, setMode] = useState("All work modes");
  const [view, setView] = useState("list");
  const [modal, setModal] = useState("");
  const [detail, setDetail] = useState(null);
  const [formStage, setFormStage] = useState("Applied");
  const [formMode, setFormMode] = useState("Remote");
  const [related, setRelated] = useState("1");
  const [authNotice, setAuthNotice] = useState(false);
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
    setFormStage("Applied");
    setFormMode("Remote");
    setRelated(String(apps[0]?.id || ""));
    setModal(kind);
  }
  function changeStage(id, stage) {
    setApps((a) =>
      a.map((x) =>
        x.id === id && x.stage !== stage
          ? {
              ...x,
              stage,
              history: [...x.history, { stage, date: getToday() }],
            }
          : x,
      ),
    );
    toast.success("Application stage updated");
  }
  function complete(id) {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }
  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const val = (s) => String(f.get(s) || "").trim();
    const url = val("url");
    if (url && !/^https?:\/\//i.test(url)) {
      toast.error("Use a link starting with https:// or http://");
      return;
    }
    if (
      modal !== "application" &&
      (!val("title") || !apps.some((item) => item.id === related))
    ) {
      toast.error("Choose an application and enter a title.");
      return;
    }
    if (modal === "application") {
      if (!val("company") || !val("role")) return;
      const entry = {
        id: crypto.randomUUID(),
        company: val("company"),
        role: val("role"),
        location: val("location"),
        mode: formMode,
        stage: formStage,
        date: val("date"),
        url: val("url"),
        notes: val("notes"),
        resume: val("resume"),
        history: [{ stage: formStage, date: val("date") }],
      };
      setApps((a) => [entry, ...a]);
      toast.success("Application added");
    }
    if (modal === "interview") {
      setInterviews((a) => [
        ...a,
        {
          id: crypto.randomUUID(),
          appId: related,
          round: val("title"),
          date: val("date"),
          time: val("time"),
          link: val("url"),
          notes: val("notes"),
        },
      ]);
      toast.success("Interview scheduled");
    }
    if (modal === "task") {
      setTasks((a) => [
        ...a,
        {
          id: crypto.randomUUID(),
          appId: related,
          title: val("title"),
          date: val("date"),
          done: false,
        },
      ]);
      toast.success("Follow-up added");
    }
    setModal("");
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "238px" }}>
      <Toaster theme={theme} position="bottom-right" />
      <AppSidebar
        page={page}
        go={go}
        apps={apps}
        pending={pending}
        setPage={setPage}
        setAuthNotice={setAuthNotice}
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
            <span className="prototype">Design preview · sample data</span>
            <span className="avatar small">SK</span>
          </div>
        </header>
        {page === "Sign in" ? (
          <SignIn
            authNotice={authNotice}
            setAuthNotice={setAuthNotice}
            go={go}
          />
        ) : (
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
                    ? "Let’s move you forward, Sarth."
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
                theme={theme}
                changeTheme={changeTheme}
                setPage={setPage}
                setAuthNotice={setAuthNotice}
              />
            )}
            <footer className="workspace-footer">
              <span>Make your next move count.</span>
              <span>
                JobTrack <span> / </span> Your career, in motion
              </span>
            </footer>
          </main>
        )}
      </div>
      <EntryDialog
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
        app={app}
        setDetail={setDetail}
        changeStage={changeStage}
        setApps={setApps}
        add={add}
        setRelated={setRelated}
      />
    </SidebarProvider>
  );
}
