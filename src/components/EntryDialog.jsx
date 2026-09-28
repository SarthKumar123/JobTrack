import { getToday } from "@/lib/dates";

import { ArrowRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Choice } from "@/components/common";
import { stages } from "@/data/demo";

export default function EntryDialog({
  modal,
  setModal,
  submit,
  formMode,
  setFormMode,
  formStage,
  setFormStage,
  related,
  setRelated,
  apps,
}) {
  return (
    <Dialog open={!!modal} onOpenChange={(o) => !o && setModal("")}>
      <DialogContent className="form-dialog">
        <DialogHeader>
          <DialogTitle>
            {modal === "application"
              ? "Add an application"
              : modal === "interview"
                ? "Schedule an interview"
                : "Add a follow-up"}
          </DialogTitle>
          <DialogDescription>
            {modal === "application"
              ? "Capture the opportunity. Take the next step."
              : "Keep your next step on the calendar."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="entry-form">
          {modal === "application" ? (
            <>
              <div className="form-grid">
                <label>
                  Company *
                  <input
                    name="company"
                    placeholder="e.g. Freshworks"
                    required
                    maxLength={100}
                  />
                </label>
                <label>
                  Role *
                  <input
                    name="role"
                    placeholder="e.g. Java Developer"
                    required
                    maxLength={150}
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  Location
                  <input
                    name="location"
                    placeholder="e.g. Hyderabad"
                    maxLength={100}
                  />
                </label>
                <label>
                  Work mode
                  <Choice
                    label="Work mode"
                    value={formMode}
                    onChange={setFormMode}
                    items={["Remote", "Hybrid", "On-site"]}
                  />
                </label>
              </div>
              <div className="form-grid">
                <label>
                  Status
                  <Choice
                    label="Application status"
                    value={formStage}
                    onChange={setFormStage}
                    items={stages}
                  />
                </label>
                <label>
                  Date added *
                  <input
                    name="date"
                    type="date"
                    defaultValue={getToday()}
                    required
                  />
                </label>
              </div>
              <label>
                Job link
                <input name="url" type="url" placeholder="https://…" />
              </label>
              <label>
                Resume version
                <input name="resume" placeholder="e.g. Java Backend Resume" />
              </label>
            </>
          ) : (
            <>
              <label>
                Application
                <Select value={related} onValueChange={setRelated}>
                  <SelectTrigger
                    className="choice"
                    aria-label="Related application"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {apps.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.company} · {a.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label>
                {modal === "interview" ? "Interview round" : "Task"} *
                <input
                  name="title"
                  required
                  placeholder={
                    modal === "interview"
                      ? "e.g. Technical interview"
                      : "e.g. Follow up with recruiter"
                  }
                  maxLength={150}
                />
              </label>
              <div className="form-grid">
                <label>
                  Date *
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={getToday()}
                  />
                </label>
                {modal === "interview" && (
                  <label>
                    Time (IST) *
                    <input
                      name="time"
                      type="time"
                      required
                      defaultValue="14:30"
                    />
                  </label>
                )}
              </div>
              {modal === "interview" && (
                <label>
                  Meeting link
                  <input
                    type="url"
                    name="url"
                    placeholder="https://meet.google.com/…"
                  />
                </label>
              )}
            </>
          )}
          {modal !== "task" && (
            <label>
              {modal === "application"
                ? "Job description / notes"
                : "Preparation notes"}
              <textarea
                name="notes"
                rows={3}
                placeholder="Anything you want to remember…"
                maxLength={5000}
              />
            </label>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setModal("")}
            >
              Cancel
            </button>
            <button className="primary" type="submit">
              {modal === "application"
                ? "Save application"
                : modal === "interview"
                  ? "Save interview"
                  : "Save follow-up"}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
