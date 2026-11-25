// @ts-nocheck -- part of the generated Tasks screen, under its JS runtime contract.
//
// The shared list itself, in the one state it is in: still loading, unreadable, empty, or
// the tasks newest first.
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";

import { HAIRLINE, MONO, THICK } from "./constants";
import TaskRow from "./TaskRow";

const { Empty } = UI;
const { AlertCircle } = Icons;

export default function TaskList({ tasks, loading, loadFailed, freshId, onToggle, onAskDelete }) {
  return (
    /* b-4-0 */
    <section data-wf="b-4-0" className="mt-8">
      <h2
        className="pb-3 text-2xl font-bold"
        style={{ fontFamily: brand.fontHeading, borderBottom: THICK }}
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
          style={{ border: HAIRLINE, fontFamily: MONO, color: brand.primaryColor }}
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
            border: THICK,
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
          {tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              index={index}
              fresh={task.id === freshId}
              onToggle={onToggle}
              onAskDelete={onAskDelete}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
