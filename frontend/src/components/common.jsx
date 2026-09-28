import { BriefcaseBusiness } from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <BriefcaseBusiness size={21} />
      </span>
      jobtrack<span className="brand-period">.</span>
    </div>
  );
}
export function Badge({ stage }) {
  return <span className={"badge " + stage.toLowerCase()}>{stage}</span>;
}
export function Company({ name }) {
  return (
    <span
      className={
        "company-icon company-" + name.toLowerCase().replaceAll(" ", "-")
      }
    >
      {name.slice(0, 1)}
    </span>
  );
}
export function Choice({ value, onChange, items, label }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="choice">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((v) => (
          <SelectItem key={v} value={v}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
