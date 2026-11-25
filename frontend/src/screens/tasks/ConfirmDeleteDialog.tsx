// Deleting is for good, so it is confirmed first. The dialog names the task it would
// remove, takes the focus while it is open and closes on Escape.
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";

import { FOCUS_RING, HAIRLINE, MONO, THICK } from "./constants";
import { formatStamp } from "./order";
import type { Task } from "./types";

// React 19 hands a function component its `ref` as an ordinary prop, and the kit's Button
// spreads every prop it is given onto the <button>; its own prop type, which this screen
// does not own, stops short of saying so.
const Button = UI.Button as React.FC<
  React.ComponentProps<typeof UI.Button> & { ref?: React.Ref<HTMLButtonElement> }
>;
const { Trash } = Icons;

export type ConfirmDeleteDialogProps = {
  /** The task the visitor asked to delete, named in the dialog. */
  task: Task;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteDialog({
  task,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    if (cancelRef.current) cancelRef.current.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
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
          border: THICK,
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
            style={{ border: HAIRLINE, fontFamily: MONO }}
          >
            {task.title}
          </p>
          <p
            className="mt-2 text-xs uppercase tracking-[0.15em]"
            style={{
              fontFamily: MONO,
              fontVariantNumeric: "tabular-nums",
              color: brand.neutralColor,
            }}
          >
            {formatStamp(task.createdAt)}
          </p>
        </div>
        <div className="grid grid-cols-2" style={{ borderTop: THICK }}>
          {/* b-8-0 */}
          <Button
            data-wf="b-8-0"
            data-testid="cancel-btn"
            type="button"
            ref={cancelRef}
            onClick={onCancel}
            className={
              "min-h-[52px] w-full px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
              FOCUS_RING
            }
            style={{
              borderRight: THICK,
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
            onClick={onConfirm}
            className={
              "flex min-h-[52px] w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
              FOCUS_RING
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
  );
}
