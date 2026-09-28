import { Checkbox } from "@/components/ui/checkbox";

import { dateLabel, getToday } from "@/lib/dates";

export default function TaskList({ list, apps, complete }) {
  const today = getToday();
  return list.map((t) => (
    <div className={"task-row " + (t.done ? "done" : "")} key={t.id}>
      <Checkbox
        aria-label={"Complete " + t.title}
        checked={t.done}
        onCheckedChange={() => complete(t.id)}
      />
      <div>
        <strong>{t.title}</strong>
        <small>
          {apps.find((a) => a.id === t.appId)?.company || "General"}{" "}
          <span>·</span> {dateLabel(t.date)}
        </small>
      </div>
      <span className={"due " + (t.date < today && !t.done ? "overdue" : "")}>
        {t.done
          ? "Done"
          : t.date === today
            ? "Today"
            : t.date < today
              ? "Overdue"
              : ""}
      </span>
    </div>
  ));
}
