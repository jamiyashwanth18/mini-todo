// @ts-nocheck -- part of the generated Tasks screen, under its JS runtime contract.
//
// Adding a task: a title and nothing else, with the character count and the one message a
// refused add can show.
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";

import { FOCUS_RING, HAIRLINE, MAX_TITLE, MONO, THICK } from "./constants";

const { Button, Input, Label } = UI;
const { Plus, AlertCircle } = Icons;

export default function AddTaskForm({ title, error, inputRef, onTitleChange, onSubmit }) {
  const atLimit = title.length >= MAX_TITLE;

  return (
    <>
      <form
        data-testid="add-a-task-form"
        onSubmit={onSubmit}
        noValidate
        className="mt-8 grid grid-cols-12 gap-4"
      >
        {/* b-2-0 */}
        <div
          data-wf="b-2-0"
          className="col-span-12 md:col-span-9 p-5"
          style={{
            border: THICK,
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
            onChange={(e) => onTitleChange(e.target.value.slice(0, MAX_TITLE))}
            placeholder="Rinse the coffee filter"
            className={"mt-2 w-full bg-transparent px-3 py-3 text-lg " + FOCUS_RING}
            style={{
              border: THICK,
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
              FOCUS_RING
            }
            style={{
              border: THICK,
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
            style={{ border: HAIRLINE, fontFamily: MONO, color: brand.primaryColor }}
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>
    </>
  );
}
