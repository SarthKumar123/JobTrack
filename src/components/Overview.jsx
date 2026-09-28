import {
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";

import { stages } from "@/data/demo";

export default function Overview({ apps, active, interviews, go, setFilter }) {
  return (
    <>
      <div className="stats-grid">
        {[
          {
            title: "Total applications",
            value: apps.length,
            foot: "Your opportunities so far",
            icon: BriefcaseBusiness,
            tone: "blue",
          },
          {
            title: "In progress",
            value: active.length,
            foot: "Moving through the pipeline",
            icon: ArrowUpRight,
            tone: "violet",
          },
          {
            title: "Interviews",
            value: interviews.length,
            foot: "On your calendar",
            icon: CalendarDays,
            tone: "orange",
          },
          {
            title: "Offers received",
            value: apps.filter((a) => a.stage === "Offer").length,
            foot: "A new chapter awaits",
            icon: CheckSquare,
            tone: "green",
          },
        ].map((s) => (
          <article className="stat" key={s.title}>
            <div>
              <span>{s.title}</span>
              <span className={"stat-icon " + s.tone}>
                <s.icon size={18} />
              </span>
            </div>
            <strong>{s.value.toString().padStart(2, "0")}</strong>
            <small>{s.foot}</small>
          </article>
        ))}
      </div>
      <div className="overview-simple">
        <article className="panel pipeline">
          <div className="panel-heading">
            <div>
              <h2>Application pipeline</h2>
              <p>Where your opportunities stand</p>
            </div>
            <span className="subtle-tag">All time</span>
          </div>
          <div className="pipeline-bars">
            {["Saved", "Applied", "Screening", "Interview", "Offer"].map(
              (s, i) => {
                const count = apps.filter((a) => a.stage === s).length;
                return (
                  <button
                    key={s}
                    aria-label={`View ${s.toLowerCase()} applications`}
                    onClick={() => {
                      go("Applications");
                      setFilter(s);
                    }}
                  >
                    <div className="bar-label">
                      <strong>{count.toString().padStart(2, "0")}</strong>
                      <span>{s}</span>
                    </div>
                    <div className="bar-track">
                      <span
                        style={{
                          height:
                            Math.max(
                              6,
                              (count /
                                Math.max(
                                  ...stages.map(
                                    (st) =>
                                      apps.filter((a) => a.stage === st).length,
                                  ),
                                  1,
                                )) *
                                100,
                            ) + "%",
                          background: [
                            "#b9c8fa",
                            "#7293ed",
                            "#496de0",
                            "#2e50c6",
                            "#142b79",
                          ][i],
                        }}
                      />
                    </div>
                  </button>
                );
              },
            )}
          </div>
          <div className="pipeline-foot">
            <span>
              <span className="tiny-dot" /> {active.length} active applications
            </span>
            <button className="text-btn" onClick={() => go("Applications")}>
              View pipeline <ArrowRight size={14} />
            </button>
          </div>
        </article>
      </div>
    </>
  );
}
