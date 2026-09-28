import { Search, ChevronRight } from "lucide-react";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Badge, Company } from "@/components/common";

import { dateLabel } from "@/lib/dates";

export default function ApplicationTable({
  list,
  setDetail,
  setQuery,
  setFilter,
  setMode,
}) {
  return (
    <div className="table-wrap">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company & role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Work mode</TableHead>
            <TableHead>Date added</TableHead>
            <TableHead>
              <span className="sr-only">Details</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <button
                  className="company-cell"
                  onClick={() => setDetail(a.id)}
                >
                  <Company name={a.company} />
                  <span>
                    <strong>{a.company}</strong>
                    <small>{a.role}</small>
                  </span>
                </button>
              </TableCell>
              <TableCell>
                <Badge stage={a.stage} />
              </TableCell>
              <TableCell>
                <span className="muted">{a.mode}</span>
              </TableCell>
              <TableCell>
                <span className="muted">{dateLabel(a.date)}</span>
              </TableCell>
              <TableCell>
                <button
                  className="icon-btn"
                  aria-label={"View " + a.company}
                  onClick={() => setDetail(a.id)}
                >
                  <ChevronRight size={17} />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {list.length === 0 && (
        <div className="empty">
          <Search />
          <h3>No applications found</h3>
          <p>Try another search or add your first application.</p>
          <button
            className="secondary"
            onClick={() => {
              setQuery("");
              setFilter("All stages");
              setMode("All work modes");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
