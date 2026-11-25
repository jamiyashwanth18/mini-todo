// @ts-nocheck -- part of the generated Tasks screen, under its JS runtime contract.
//
// What the page says about itself: the product, the count of tasks and of done ones, and
// when the server last confirmed what is on screen.
import React from "react";

import { brand } from "@/lib/brand";

import { MONO, PRODUCT, THICK } from "./constants";
import { formatStamp } from "./order";

export default function TasksHeader({ total, doneCount, syncedAt }) {
  return (
    <>
      {/* b-0-0 */}
      <header
        data-wf="b-0-0"
        className="flex flex-wrap items-end justify-between gap-6 pb-4"
        style={{ borderBottom: THICK }}
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
            {String(total).padStart(2, "0")}
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
        style={{ borderBottom: THICK }}
      >
        One list shared by everyone. No sign-in needed and the app is free to use.
      </p>

      <p
        className="mt-3 text-xs uppercase tracking-[0.2em]"
        style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: brand.neutralColor }}
      >
        Saved on the server · last synced {syncedAt ? formatStamp(syncedAt) : "—"}
      </p>
    </>
  );
}
