"use client";

import { useState } from "react";
import clsx from "clsx";

interface ChartCardProps {
  title: string;
  description?: string;
  /** Pass a TableView element when this chart has 2+ series (the skill's
   *  accessibility-twin requirement). A single-series trend line may omit
   *  this — its one value per point is already reachable via the axis and
   *  hover tooltip, and the headline number is shown in a stat card
   *  elsewhere on the same tab, so a second full data table would be pure
   *  duplication for no added reachability. */
  tableView?: React.ReactNode;
  children: React.ReactNode;
}

export function ChartCard({ title, description, tableView, children }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          {description && <p className="text-xs text-text-subtle mt-0.5">{description}</p>}
        </div>
        {tableView && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            className={clsx(
              "flex-shrink-0 text-xs px-2 py-1 rounded-lg border transition",
              showTable
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-surface text-text-muted border-border-subtle hover:text-text"
            )}
          >
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </div>
      {showTable && tableView ? tableView : children}
    </div>
  );
}
