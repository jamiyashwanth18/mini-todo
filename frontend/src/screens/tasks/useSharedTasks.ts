// @ts-nocheck -- part of the generated Tasks screen, under its JS runtime contract.
//
// The shared list and every change to it, kept away from the markup that shows it.
//
// Every change is a call to the server; the row changes on screen at once so the app stays
// usable, and a refused or unreachable call is reported instead of being swallowed. What
// the visitor did stays on screen, so nothing they typed is lost.
//
// A row added here has only a local id until the server answers with the task's own. What
// the visitor does to that row meanwhile is remembered against the local id and applied
// once the answer arrives: marking it done saves that status, and deleting it removes the
// task the server has just created rather than leaving a ghost behind on the shared list.
import React from "react";

import { api } from "@/api/client";

import { LOCAL_ID_PREFIX } from "./constants";

function isLocal(id) {
  return String(id).startsWith(LOCAL_ID_PREFIX);
}

function refusedSave(title) {
  return "“" + title + "” could not be saved on the server.";
}

function refusedDelete(title) {
  return "“" + title + "” could not be removed on the server.";
}

export function useSharedTasks() {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [freshId, setFreshId] = React.useState(null);
  // When the server last confirmed a read or a write, and what it refused, if anything.
  const [syncedAt, setSyncedAt] = React.useState(null);
  const [syncError, setSyncError] = React.useState("");

  // What the visitor did to a row whose create has not come back yet, by local id.
  const pending = React.useRef(new Map());
  // Counts the rows added in this browser session so each gets its own React key. The
  // "local-" prefix keeps such a key apart from any id the server hands out, whatever the
  // ids on the shared list look like.
  const counter = React.useRef(1);

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
        setSyncedAt(new Date().toISOString());
      }
      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, []);

  const send = React.useCallback(async (call) => {
    try {
      const answer = (await call()) ?? {};
      if (answer.error) return { ok: false };
      setSyncError("");
      setSyncedAt(new Date().toISOString());
      return { ok: true, data: answer.data };
    } catch {
      return { ok: false };
    }
  }, []);

  const addTask = React.useCallback(
    async (title) => {
      const localId = LOCAL_ID_PREFIX + counter.current++;
      pending.current.set(localId, { done: false, deleted: false });
      setTasks((prev) => [
        { id: localId, title, done: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setFreshId(localId);

      const { ok, data } = await send(() => api.POST("/tasks", { body: { title } }));
      const meanwhile = pending.current.get(localId) ?? { done: false, deleted: false };
      pending.current.delete(localId);

      if (!ok || !data || !data.id) {
        // Nothing was created, so a row deleted meanwhile leaves nothing behind.
        if (!meanwhile.deleted) setSyncError(refusedSave(title));
        return;
      }
      if (meanwhile.deleted) {
        const gone = await send(() =>
          api.DELETE("/tasks/{id}", { params: { path: { id: data.id } } }),
        );
        if (!gone.ok) setSyncError(refusedDelete(title));
        return;
      }
      // The task as the server stored it: its own id and creation time replace ours, and
      // a status the visitor set while it was in flight is kept and then saved.
      setTasks((prev) =>
        prev.map((t) => (t.id === localId ? { ...t, ...data, done: meanwhile.done } : t)),
      );
      setFreshId(data.id);
      if (meanwhile.done !== Boolean(data.done)) {
        const saved = await send(() =>
          api.PATCH("/tasks/{id}", {
            params: { path: { id: data.id } },
            body: { done: meanwhile.done },
          }),
        );
        if (!saved.ok) setSyncError(refusedSave(title));
      }
    },
    [send],
  );

  const setDone = React.useCallback(
    async (task, done) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done } : t)));

      if (isLocal(task.id)) {
        // A row the server has not answered for yet: the create carries the status, and a
        // row it never accepted has no task to change there, which the refused add said.
        const meanwhile = pending.current.get(task.id);
        if (meanwhile) meanwhile.done = done;
        return;
      }
      const { ok } = await send(() =>
        api.PATCH("/tasks/{id}", { params: { path: { id: task.id } }, body: { done } }),
      );
      if (!ok) setSyncError(refusedSave(task.title));
    },
    [send],
  );

  const removeTask = React.useCallback(
    async (task) => {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));

      if (isLocal(task.id)) {
        // The create is still in flight: it deletes what it creates rather than putting a
        // task back that the visitor has already removed.
        const meanwhile = pending.current.get(task.id);
        if (meanwhile) meanwhile.deleted = true;
        return;
      }
      const { ok } = await send(() =>
        api.DELETE("/tasks/{id}", { params: { path: { id: task.id } } }),
      );
      if (!ok) setSyncError(refusedDelete(task.title));
    },
    [send],
  );

  return {
    tasks,
    loading,
    loadFailed,
    freshId,
    syncedAt,
    syncError,
    addTask,
    setDone,
    removeTask,
  };
}
