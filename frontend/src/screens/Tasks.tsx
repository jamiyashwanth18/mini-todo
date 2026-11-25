// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { api } from "@/api/client";

const { Button, Input, Label, Empty } = UI;
const { Plus, Check, X, Clock, Trash, AlertCircle } = Icons;

const PRODUCT = "Mini Todo";
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const MAX_TITLE = 100;
const NOW_STAMP = "2026-11-25 10:00";

// A task holds a title, a done/not-done status and a creation time. Nothing else is
// stored or shown: no due date, no priority, no category, no description.

// Creation times arrive as ISO date-times from the API; the list shows them as
// "YYYY-MM-DD HH:mm" in the reader's own time.
function formatStamp(value) {
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

function stampValue(value) {
  const at = Date.parse(value);
  return Number.isNaN(at) ? 0 : at;
}

// Newest first by creation time, whatever order the list arrived in. Done tasks are
// ordered with the rest: they stay in place, never moved or hidden.
function newestFirst(list) {
  return [...list].sort((a, b) => stampValue(b.createdAt) - stampValue(a.createdAt));
}

export default function Screen() {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [freshId, setFreshId] = React.useState(null);
  const [pendingDelete, setPendingDelete] = React.useState(null);

  const inputRef = React.useRef(null);
  const cancelRef = React.useRef(null);
  const returnFocusRef = React.useRef(null);
  // Counts the rows added in this browser session so each gets its own React key. The
  // "local-" prefix keeps such a key apart from any id the server hands out, whatever the
  // ids on the shared list look like.
  const counterRef = React.useRef(1);

  const thick = `3px solid ${brand.primaryColor}`;
  const hairline = `1px solid ${brand.primaryColor}`;
  const ordered = React.useMemo(() => newestFirst(tasks), [tasks]);
  const doneCount = tasks.filter((t) => t.done).length;
  const atLimit = title.length >= MAX_TITLE;

  React.useEffect(() => {
    let live = true;
    (async () => {
      const { data, error: failed } = await api.GET("/tasks");
      if (!live) return;
      if (failed || !Array.isArray(data)) {
        setLoadFailed(true);
      } else {
        setTasks(data);
        setLoadFailed(false);
      }
      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, []);

  React.useEffect(() => {
    if (!pendingDelete) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKey);
    if (cancelRef.current) cancelRef.current.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [pendingDelete]);

  function closeDialog() {
    setPendingDelete(null);
    if (returnFocusRef.current && returnFocusRef.current.focus) returnFocusRef.current.focus();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("A title is required");
      setStatus("");
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    const id = "local-" + counterRef.current++;
    setTasks((prev) => [
      { id, title: trimmed, done: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setTitle("");
    setError("");
    setFreshId(id);
    setStatus("“" + trimmed + "” added to the top of the shared list.");
    if (inputRef.current) inputRef.current.focus();
  }

  function toggleDone(task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    setStatus("“" + task.title + "” is now marked " + (task.done ? "not done" : "done") + ".");
  }

  function askDelete(task, e) {
    returnFocusRef.current = e && e.currentTarget ? e.currentTarget : null;
    setPendingDelete(task);
  }

  function confirmDelete() {
    const victim = pendingDelete;
    setTasks((prev) => prev.filter((t) => t.id !== victim.id));
    setPendingDelete(null);
    setStatus("Task deleted");
    if (inputRef.current) inputRef.current.focus();
  }

  const focusRing =
    "focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2";

  return (
    <div style={{ color: brand.primaryColor, fontFamily: brand.fontBody }}>
      <style>{`
        @keyframes wfRowIn { from { opacity: 0; transform: translate(-10px, -10px); } to { opacity: 1; transform: none; } }
        @keyframes wfPanelIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .wf-row-in { animation: wfRowIn 220ms ease-out both; }
        .wf-panel-in { animation: wfPanelIn 160ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .wf-row-in, .wf-panel-in { animation: none !important; }
          .wf-shift { transition: none !important; }
        }
      `}</style>

      {/* b-0-0 */}
      <header
        data-wf="b-0-0"
        className="flex flex-wrap items-end justify-between gap-6 pb-4"
        style={{ borderBottom: thick }}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ fontFamily: MONO }}>
            {PRODUCT} / Index
          </p>
          <h1
            data-testid="shared-to-do-list-title"
            className="mt-2 text-6xl font-bold leading-none tracking-tight sm:text-7xl"
            style={{ fontFamily: brand.fontHeading }}
          >
            Shared to-do list
          </h1>
        </div>
        <p className="text-right">
          <span
            className="block text-5xl font-bold leading-none"
            style={{ fontFamily: brand.fontHeading, fontVariantNumeric: "tabular-nums" }}
          >
            {String(tasks.length).padStart(2, "0")}
          </span>
          <span
            className="mt-2 block text-xs uppercase tracking-[0.2em]"
            style={{
              fontFamily: MONO,
              fontVariantNumeric: "tabular-nums",
              color: brand.neutralColor,
            }}
          >
            tasks · {String(doneCount).padStart(2, "0")} done
          </span>
        </p>
      </header>

      {/* b-1-0 */}
      <p
        data-wf="b-1-0"
        className="max-w-[62ch] py-4 text-sm leading-relaxed"
        style={{ borderBottom: thick }}
      >
        One list shared by everyone. No sign-in needed and the app is free to use.
      </p>

      <p
        className="mt-3 text-xs uppercase tracking-[0.2em]"
        style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: brand.neutralColor }}
      >
        Saved on the server · last synced {NOW_STAMP}
      </p>

      <form
        data-testid="add-a-task-form"
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 grid grid-cols-12 gap-4"
      >
        {/* b-2-0 */}
        <div
          data-wf="b-2-0"
          className="col-span-12 md:col-span-9 p-5"
          style={{
            border: thick,
            borderRadius: brand.radius,
            boxShadow: `6px 6px 0 ${brand.primaryColor}`,
            backgroundColor: brand.backgroundColor,
          }}
        >
          <h2 className="text-3xl font-bold leading-none" style={{ fontFamily: brand.fontHeading }}>
            Add a task
          </h2>
          <Label
            htmlFor="task-title"
            className="mt-4 block text-xs font-bold uppercase tracking-[0.2em]"
            style={{ fontFamily: MONO }}
          >
            Title (max 100 characters)
          </Label>
          <Input
            data-wf="i-2-0-0"
            data-testid="title-max-100-characters-input"
            id="task-title"
            ref={inputRef}
            name="title"
            value={title}
            maxLength={MAX_TITLE}
            autoComplete="off"
            aria-describedby="title-counter title-help"
            aria-invalid={error ? "true" : "false"}
            aria-errormessage={error ? "title-error" : undefined}
            onChange={(e) => {
              setTitle(e.target.value.slice(0, MAX_TITLE));
              if (error) setError("");
            }}
            placeholder="Rinse the coffee filter"
            className={"mt-2 w-full bg-transparent px-3 py-3 text-lg " + focusRing}
            style={{
              border: thick,
              borderRadius: brand.radius,
              fontFamily: MONO,
              color: brand.primaryColor,
              outlineColor: brand.accentColor,
            }}
          />
          <p
            id="title-help"
            className="mt-2 text-xs"
            style={{ fontFamily: MONO, color: brand.neutralColor }}
          >
            Maximum 100 characters. Press Enter to add. Titles can’t be edited later — delete and
            re-add instead.
          </p>
        </div>

        {/* b-2-1 */}
        <div className="col-span-12 md:col-span-3 flex">
          <Button
            data-wf="b-2-1"
            data-testid="add-task-btn"
            type="submit"
            className={
              "wf-shift w-full min-h-[56px] items-center justify-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-transform hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 " +
              focusRing
            }
            style={{
              border: thick,
              borderRadius: brand.radius,
              backgroundColor: brand.primaryColor,
              color: brand.backgroundColor,
              boxShadow: `6px 6px 0 ${brand.accentColor}`,
              fontFamily: MONO,
              outlineColor: brand.accentColor,
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add task
          </Button>
        </div>
      </form>

      {/* b-3-0 */}
      <div data-wf="b-3-0" className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <p
          id="title-counter"
          className="text-xs uppercase tracking-[0.2em]"
          style={{
            fontFamily: MONO,
            fontVariantNumeric: "tabular-nums",
            color: atLimit ? brand.accentColor : brand.neutralColor,
          }}
        >
          {title.length}/{MAX_TITLE} characters used.
          {atLimit ? " Maximum 100 characters." : ""}
        </p>
        {error ? (
          <p
            id="title-error"
            className="flex items-center gap-2 px-2 py-1 text-xs font-bold uppercase tracking-[0.15em]"
            style={{ border: hairline, fontFamily: MONO, color: brand.primaryColor }}
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>

      <p
        aria-live="polite"
        className="mt-2 min-h-[1rem] text-xs uppercase tracking-[0.15em]"
        style={{ fontFamily: MONO, color: brand.neutralColor }}
      >
        {status}
      </p>

      {/* b-4-0 */}
      <section data-wf="b-4-0" className="mt-8">
        <h2
          className="pb-3 text-2xl font-bold"
          style={{ fontFamily: brand.fontHeading, borderBottom: thick }}
        >
          Tasks, newest first
        </h2>

        {loading ? (
          <p
            className="mt-6 text-xs uppercase tracking-[0.2em]"
            style={{ fontFamily: MONO, color: brand.neutralColor }}
          >
            Loading tasks…
          </p>
        ) : loadFailed ? (
          <p
            className="mt-6 flex items-center gap-2 px-3 py-3 text-xs font-bold uppercase tracking-[0.15em]"
            style={{ border: hairline, fontFamily: MONO, color: brand.primaryColor }}
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Tasks could not be loaded
          </p>
        ) : tasks.length === 0 ? (
          /* b-6-0 */
          <div
            data-wf="b-6-0"
            data-testid="no-tasks-yet-empty"
            className="mt-6 p-8 text-center"
            style={{
              border: thick,
              borderRadius: brand.radius,
              boxShadow: `6px 6px 0 ${brand.primaryColor}`,
              backgroundColor: brand.backgroundColor,
            }}
          >
            <Empty
              title="No tasks yet"
              description="Nothing is on the shared list right now. Add the first task above and everyone who opens Mini Todo will see it."
            />
          </div>
        ) : (
          <ol data-testid="tasks-newest-first-list" className="mt-6 space-y-6">
            {ordered.map((task, index) => (
              <li
                key={task.id}
                className={task.id === freshId ? "wf-row-in" : undefined}
                style={{
                  border: thick,
                  borderRadius: brand.radius,
                  boxShadow: `6px 6px 0 ${task.done ? brand.neutralColor : brand.primaryColor}`,
                  backgroundColor: brand.backgroundColor,
                }}
              >
                <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-6 p-5">
                  <span
                    className="text-5xl font-bold leading-none"
                    style={{
                      fontFamily: brand.fontHeading,
                      fontVariantNumeric: "tabular-nums",
                      color: task.done ? brand.neutralColor : brand.primaryColor,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3
                      data-wf={"i-4-0-" + index}
                      className="text-3xl font-bold leading-tight break-words"
                      style={{
                        fontFamily: brand.fontHeading,
                        textDecoration: task.done ? "line-through" : "none",
                        textDecorationThickness: 3,
                        color: task.done ? brand.neutralColor : brand.primaryColor,
                      }}
                    >
                      {task.title}
                    </h3>
                    <p
                      className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.15em]"
                      style={{
                        fontFamily: MONO,
                        fontVariantNumeric: "tabular-nums",
                        color: brand.neutralColor,
                      }}
                    >
                      <span
                        className="inline-flex items-center gap-1 font-bold"
                        style={{ color: task.done ? brand.accentColor : brand.primaryColor }}
                      >
                        {task.done ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {task.done ? "Done" : "Not done"}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatStamp(task.createdAt)}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2" style={{ borderTop: thick }}>
                  {task.done ? (
                    /* b-5-1 */
                    <Button
                      data-wf="b-5-1"
                      data-testid="mark-not-done-btn"
                      type="button"
                      onClick={() => toggleDone(task)}
                      className={
                        "flex min-h-[48px] w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
                        focusRing
                      }
                      style={{
                        borderRight: thick,
                        borderRadius: brand.radius,
                        backgroundColor: "transparent",
                        color: brand.primaryColor,
                        fontFamily: MONO,
                        outlineColor: brand.accentColor,
                      }}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Mark not done
                    </Button>
                  ) : (
                    /* b-5-0 */
                    <Button
                      data-wf="b-5-0"
                      data-testid="mark-done-btn"
                      type="button"
                      aria-label="Mark done"
                      onClick={() => toggleDone(task)}
                      className={
                        "flex min-h-[48px] w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
                        focusRing
                      }
                      style={{
                        borderRight: thick,
                        borderRadius: brand.radius,
                        backgroundColor: "transparent",
                        color: brand.primaryColor,
                        fontFamily: MONO,
                        outlineColor: brand.accentColor,
                      }}
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Mark done
                    </Button>
                  )}
                  {/* b-5-2 */}
                  <Button
                    data-wf="b-5-2"
                    data-testid="delete-btn"
                    type="button"
                    onClick={(e) => askDelete(task, e)}
                    className={
                      "flex min-h-[48px] w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
                      focusRing
                    }
                    style={{
                      borderRadius: brand.radius,
                      backgroundColor: "transparent",
                      color: brand.primaryColor,
                      fontFamily: MONO,
                      outlineColor: brand.accentColor,
                    }}
                  >
                    <Trash className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(10,10,10,0.55)" }}
        >
          {/* b-7-0 */}
          <div
            data-wf="b-7-0"
            data-testid="delete-this-task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-desc"
            className="wf-panel-in w-full max-w-lg"
            style={{
              border: thick,
              borderRadius: brand.radius,
              backgroundColor: brand.backgroundColor,
              boxShadow: `10px 10px 0 ${brand.accentColor}`,
            }}
          >
            <div className="p-6">
              <h2
                id="delete-title"
                className="text-4xl font-bold leading-none"
                style={{ fontFamily: brand.fontHeading }}
              >
                Delete this task?
              </h2>
              <p id="delete-desc" className="mt-3 text-sm leading-relaxed">
                It is removed from the shared list for every visitor and cannot be brought back.
              </p>
              <p
                data-wf="i-7-0-0"
                className="mt-4 px-3 py-3 text-lg font-bold"
                style={{ border: hairline, fontFamily: MONO }}
              >
                {pendingDelete.title}
              </p>
              <p
                className="mt-2 text-xs uppercase tracking-[0.15em]"
                style={{
                  fontFamily: MONO,
                  fontVariantNumeric: "tabular-nums",
                  color: brand.neutralColor,
                }}
              >
                {formatStamp(pendingDelete.createdAt)}
              </p>
            </div>
            <div className="grid grid-cols-2" style={{ borderTop: thick }}>
              {/* b-8-0 */}
              <Button
                data-wf="b-8-0"
                data-testid="cancel-btn"
                type="button"
                ref={cancelRef}
                onClick={closeDialog}
                className={
                  "min-h-[52px] w-full px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
                  focusRing
                }
                style={{
                  borderRight: thick,
                  borderRadius: brand.radius,
                  backgroundColor: "transparent",
                  color: brand.primaryColor,
                  fontFamily: MONO,
                  outlineColor: brand.accentColor,
                }}
              >
                Cancel
              </Button>
              {/* b-8-1 */}
              <Button
                data-wf="b-8-1"
                data-testid="delete-task-btn"
                type="button"
                onClick={confirmDelete}
                className={
                  "flex min-h-[52px] w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
                  focusRing
                }
                style={{
                  borderRadius: brand.radius,
                  backgroundColor: brand.primaryColor,
                  color: brand.backgroundColor,
                  fontFamily: MONO,
                  outlineColor: brand.accentColor,
                }}
              >
                <Trash className="h-4 w-4" aria-hidden="true" />
                Delete task
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
