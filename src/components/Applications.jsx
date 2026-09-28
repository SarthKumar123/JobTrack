import { ArrowUpRight, Search, LayoutGrid, List } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Badge, Company, Choice } from "@/components/common";
import { stages } from "@/data/demo";
import { dateLabel } from "@/lib/dates";

import ApplicationTable from "@/components/ApplicationTable";
export default function Applications({
  filtered,
  query,
  setQuery,
  filter,
  setFilter,
  mode,
  setMode,
  view,
  setView,
  setDetail,
}) {
  return (
    <>
      <div className="filterbar">
        <div className="searchbox">
          <Search size={18} />
          <input
            aria-label="Search applications"
            placeholder="Search company, role or location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Choice
          label="Filter by stage"
          value={filter}
          onChange={setFilter}
          items={["All stages", ...stages]}
        />
        <Choice
          label="Filter by work mode"
          value={mode}
          onChange={setMode}
          items={["All work modes", "Remote", "Hybrid", "On-site"]}
        />
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="list" aria-label="List view">
              <List size={18} />
            </TabsTrigger>
            <TabsTrigger value="board" aria-label="Board view">
              <LayoutGrid size={18} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="results-count">{filtered.length} opportunities</div>
      {view === "list" ? (
        <article className="panel">
          <ApplicationTable
            list={filtered}
            setDetail={setDetail}
            setQuery={setQuery}
            setFilter={setFilter}
            setMode={setMode}
          />
        </article>
      ) : (
        <div className="board">
          {stages
            .filter((s) => filter === "All stages" || filter === s)
            .map((s) => (
              <section key={s} className="board-column">
                <h2>
                  <Badge stage={s} />
                  <span>{filtered.filter((a) => a.stage === s).length}</span>
                </h2>
                {filtered
                  .filter((a) => a.stage === s)
                  .map((a) => (
                    <button
                      key={a.id}
                      className="board-card"
                      onClick={() => setDetail(a.id)}
                    >
                      <Company name={a.company} />
                      <strong>{a.company}</strong>
                      <p>{a.role}</p>
                      <small>
                        {a.location} · {a.mode}
                      </small>
                      <div>
                        {dateLabel(a.date)}
                        <ArrowUpRight size={16} />
                      </div>
                    </button>
                  ))}
                {!filtered.some((a) => a.stage === s) && (
                  <p className="board-empty">No applications here yet</p>
                )}
              </section>
            ))}
        </div>
      )}
    </>
  );
}
