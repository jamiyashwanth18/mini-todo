// @ts-nocheck -- part of the generated Tasks screen, under its JS runtime contract.
//
// How a task is read off the wire: its creation time as text, and the one order the list
// is ever shown in.

// Creation times arrive as ISO date-times from the API; the list shows them as
// "YYYY-MM-DD HH:mm" in the reader's own time.
export function formatStamp(value) {
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return String(value ?? "");
  const pad = (n) => String(n).padStart(2, "0");
  return (
    at.getFullYear() +
    "-" +
    pad(at.getMonth() + 1) +
    "-" +
    pad(at.getDate()) +
    " " +
    pad(at.getHours()) +
    ":" +
    pad(at.getMinutes())
  );
}

export function stampValue(value) {
  const at = Date.parse(value);
  return Number.isNaN(at) ? 0 : at;
}

function byIdDescending(a, b) {
  const left = String(a.id ?? "");
  const right = String(b.id ?? "");
  if (left === right) return 0;
  return left < right ? 1 : -1;
}

// Newest first by creation time, whatever order the list arrived in. Done tasks are
// ordered with the rest: they stay in place, never moved or hidden.
//
// Two tasks created in the same instant are ordered by id, descending, exactly as the
// server breaks that tie (app/routers/tasks.py, list_tasks), so the same list never
// renders in two different orders.
export function newestFirst(list) {
  return [...list].sort((a, b) => {
    const byTime = stampValue(b.createdAt) - stampValue(a.createdAt);
    return byTime !== 0 ? byTime : byIdDescending(a, b);
  });
}
