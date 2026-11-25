// @ts-nocheck -- part of the generated Tasks screen, under its JS runtime contract.
//
// One task on the shared list: its number, its title, its status and its creation time,
// with the only two things that can be done to it.
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";

import { FOCUS_RING, MONO, THICK } from "./constants";
import { formatStamp } from "./order";

const { Button } = UI;
const { Check, X, Clock, Trash } = Icons;

export default function TaskRow({ task, index, fresh, onToggle, onAskDelete }) {
  return (
    <li
      className={fresh ? "wf-row-in" : undefined}
      style={{
        border: THICK,
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

      <div className="grid grid-cols-2" style={{ borderTop: THICK }}>
        {task.done ? (
          /* b-5-1 */
          <Button
            data-wf="b-5-1"
            data-testid="mark-not-done-btn"
            type="button"
            onClick={() => onToggle(task)}
            className={
              "flex min-h-[48px] w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
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
            onClick={() => onToggle(task)}
            className={
              "flex min-h-[48px] w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
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
            <Check className="h-4 w-4" aria-hidden="true" />
            Mark done
          </Button>
        )}
        {/* b-5-2 */}
        <Button
          data-wf="b-5-2"
          data-testid="delete-btn"
          type="button"
          onClick={(e) => onAskDelete(task, e)}
          className={
            "flex min-h-[48px] w-full items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] " +
            FOCUS_RING
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
  );
}
