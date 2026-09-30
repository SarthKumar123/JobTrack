import { useState } from "react";
import { CalendarDays, ExternalLink, FileText, Trash2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Company, Choice } from "@/components/common";
import { stages } from "@/lib/constants";
import { dateLabel } from "@/lib/dates";

export default function ApplicationDetails({
  app,
  setDetail,
  changeStage,
  saveNotes,
  deleteApplication,
  busy,
  add,
  setRelated,
}) {
  const [notes, setNotes] = useState(app?.notes || "");
  return (
    <Sheet open={!!app} onOpenChange={(o) => !o && setDetail(null)}>
      <SheetContent className="detail-sheet">
        <SheetHeader>
          <SheetTitle>{app?.company}</SheetTitle>
          <SheetDescription>{app?.role}</SheetDescription>
        </SheetHeader>
        {app && (
          <div className="detail-body">
            <Company name={app.company} />
            <div className="detail-meta">
              {app.location} · {app.mode}
            </div>
            <label>
              Application stage
              <Choice
                label="Change stage"
                value={app.stage}
                onChange={(s) => changeStage(app.id, s)}
                items={stages}
              />
            </label>
            {app.url && (
              <a
                href={app.url}
                target="_blank"
                rel="noreferrer"
                className="secondary"
              >
                Open job link <ExternalLink size={16} />
              </a>
            )}
            <div className="detail-section">
              <h3>
                <FileText size={17} />
                Resume version
              </h3>
              <p>{app.resume || "Not specified"}</p>
            </div>
            <label>
              Job description / notes
              <textarea
                rows={6}
                value={notes}
                maxLength={5000}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <button
              className="primary"
              disabled={busy || notes === app.notes}
              onClick={() => saveNotes(app.id, notes)}
            >
              Save notes
            </button>
            <div className="detail-section">
              <h3>Application timeline</h3>
              <div className="timeline">
                {app.history.map((h, i) => (
                  <div key={i}>
                    <span className="timeline-dot" />
                    <strong>{h.stage}</strong>
                    <small>{dateLabel(h.date)}</small>
                  </div>
                ))}
              </div>
            </div>
            <button
              className="secondary"
              onClick={() => {
                add("interview");
                setRelated(String(app.id));
                setDetail(null);
              }}
            >
              <CalendarDays size={16} />
              Schedule interview
            </button>
            <button
              className="danger-button"
              disabled={busy}
              onClick={() => {
                const confirmed = window.confirm(
                  `Permanently remove ${app.company} — ${app.role}? This also deletes its interviews and follow-ups. This cannot be undone.`,
                );
                if (confirmed) deleteApplication(app.id);
              }}
            >
              <Trash2 size={16} />
              Remove permanently
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
