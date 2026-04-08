"use client";

import { getProfileReminderDisplay } from "@/lib/profileReminderDisplay";

/** Renders profile/KYC reminder count + last sent from all-user-details/ row. */
export function ProfileReminderCell({ row }: { row: Record<string, unknown> }) {
  const rem = getProfileReminderDisplay(row);
  if (rem.count == null && !rem.lastLabel) {
    return (
      <span className="text-gray-400 text-sm" title="From API; 0 after backend tracks reminders">
        —
      </span>
    );
  }
  return (
    <div className="text-sm text-gray-600 space-y-0.5">
      {rem.count != null ? (
        <div>
          <span className="font-medium text-gray-900 tabular-nums">{rem.count}</span>{" "}
          {rem.count === 1 ? "time" : "times"}
        </div>
      ) : (
        <div className="text-gray-400">—</div>
      )}
      {rem.lastLabel ? <div className="text-xs text-gray-500">Last: {rem.lastLabel}</div> : null}
    </div>
  );
}
