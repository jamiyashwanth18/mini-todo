// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
//
// The shared to-do list, assembled from the pieces in screens/tasks/: the list and every
// change to it live in useSharedTasks, the markup in one component per section of the
// page. What is left here is what the visitor is told and asked: the wording of the
// announcements, the title being typed, and which task is awaiting a confirmed delete.
//
// A task holds a title, a done/not-done status and a creation time. Nothing else is
// stored or shown: no due date, no priority, no category, no description.
import React from "react";

import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";

import AddTaskForm from "./tasks/AddTaskForm";
import ConfirmDeleteDialog from "./tasks/ConfirmDeleteDialog";
import TaskList from "./tasks/TaskList";
import TasksHeader from "./tasks/TasksHeader";
import { HAIRLINE, MONO } from "./tasks/constants";
import { newestFirst } from "./tasks/order";
import { useSharedTasks } from "./tasks/useSharedTasks";

const { AlertCircle } = Icons;

export default function Screen() {
  const { tasks, loading, loadFailed, freshId, syncedAt, syncError, addTask, setDone, removeTask } =
    useSharedTasks();

  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState(null);

  const inputRef = React.useRef(null);
  const returnFocusRef = React.useRef(null);

  const ordered = React.useMemo(() => newestFirst(tasks), [tasks]);
  const doneCount = tasks.filter((t) => t.done).length;

  function focusInput() {
    if (inputRef.current) inputRef.current.focus();
  }

  function handleTitleChange(value) {
    setTitle(value);
    if (error) setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("A title is required");
      setStatus("");
      focusInput();
      return;
    }
    setTitle("");
    setError("");
    setStatus("“" + trimmed + "” added to the top of the shared list.");
    focusInput();
    addTask(trimmed);
  }

  function toggleDone(task) {
    const done = !task.done;
    setStatus("“" + task.title + "” is now marked " + (done ? "done" : "not done") + ".");
    setDone(task, done);
  }

  function askDelete(task, e) {
    returnFocusRef.current = e && e.currentTarget ? e.currentTarget : null;
    setPendingDelete(task);
  }

  const closeDialog = React.useCallback(() => {
    setPendingDelete(null);
    if (returnFocusRef.current && returnFocusRef.current.focus) returnFocusRef.current.focus();
  }, []);

  function confirmDelete() {
    const victim = pendingDelete;
    if (!victim) return;
    setPendingDelete(null);
    setStatus("Task deleted");
    focusInput();
    removeTask(victim);
  }

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

      <TasksHeader total={tasks.length} doneCount={doneCount} syncedAt={syncedAt} />

      <AddTaskForm
        title={title}
        error={error}
        inputRef={inputRef}
        onTitleChange={handleTitleChange}
        onSubmit={handleSubmit}
      />

      <p
        aria-live="polite"
        className="mt-2 min-h-[1rem] text-xs uppercase tracking-[0.15em]"
        style={{ fontFamily: MONO, color: brand.neutralColor }}
      >
        {status}
      </p>

      {syncError ? (
        <p
          aria-live="polite"
          className="mt-2 flex items-center gap-2 px-2 py-1 text-xs font-bold uppercase tracking-[0.15em]"
          style={{ border: HAIRLINE, fontFamily: MONO, color: brand.primaryColor }}
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {syncError}
        </p>
      ) : null}

      <TaskList
        tasks={ordered}
        loading={loading}
        loadFailed={loadFailed}
        freshId={freshId}
        onToggle={toggleDone}
        onAskDelete={askDelete}
      />

      {pendingDelete ? (
        <ConfirmDeleteDialog
          task={pendingDelete}
          onCancel={closeDialog}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  );
}
