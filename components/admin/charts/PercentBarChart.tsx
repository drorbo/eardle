"use client";

import { BarChart, type BarGroup } from "@/components/admin/charts/BarChart";

// Thin client-side wrapper around BarChart for percent-valued data. Needed
// because DailyEardleTab is an async Server Component: a `formatValue`
// closure defined there can't be passed as a prop into BarChart ("use
// client") — Next.js rejects functions crossing the Server->Client boundary
// at runtime ("Functions cannot be passed directly to Client Components").
// Defining the closure here, inside the client boundary, avoids the crossing
// entirely while keeping BarChart itself unchanged.
export function PercentBarChart({ groups }: { groups: BarGroup[] }) {
  return <BarChart groups={groups} formatValue={(v) => `${v}%`} />;
}
