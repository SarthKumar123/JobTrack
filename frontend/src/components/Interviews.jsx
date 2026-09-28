import { CalendarDays, ArrowUpRight, Clock, Video } from "lucide-react";

export default function Interviews({ interviews, apps, setDetail }) {
  return (
    <div className="interviews-list">
      {[...interviews]
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .map((i) => {
          const a = apps.find((a) => a.id === i.appId);
          return (
            <article className="panel interview-card" key={i.id}>
              <div className="date-block">
                <span>
                  {new Date(i.date + "T12:00:00").toLocaleString("en", {
                    month: "short",
                  })}
                </span>
                <strong>{i.date.slice(-2)}</strong>
                <small>
                  {new Date(i.date + "T12:00:00").toLocaleString("en", {
                    weekday: "short",
                  })}
                </small>
              </div>
              <div className="interview-info">
                <span className="eyebrow">{a?.company}</span>
                <h2>{i.round}</h2>
                <p>{a?.role}</p>
                <div className="inline-meta">
                  <Clock size={15} />
                  {i.time} IST <Video size={15} />
                  Video interview
                </div>
                <p className="interview-notes">
                  {i.notes || "No preparation notes yet."}
                </p>
              </div>
              <div className="interview-actions">
                <button
                  className="secondary"
                  onClick={() => setDetail(i.appId)}
                >
                  View application <ArrowUpRight size={15} />
                </button>
                {i.link && (
                  <a
                    className="primary"
                    href={i.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open meeting <Video size={16} />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      {!interviews.length && (
        <div className="panel empty">
          <CalendarDays />
          <h2>No interviews scheduled</h2>
          <p>Add your first round when an invitation arrives.</p>
        </div>
      )}
    </div>
  );
}
