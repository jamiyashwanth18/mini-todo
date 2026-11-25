// @ts-nocheck -- part of the generated Tasks screen, under its JS runtime contract.
//
// The few values the pieces of the Tasks screen share: the wording-free constants and the
// borders the brutalist design repeats on every panel.
import { brand } from "@/lib/brand";

export const PRODUCT = "Mini Todo";
export const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// A title is required and may be no longer than this, the same rule the API enforces.
export const MAX_TITLE = 100;

// A row added here carries this prefix until the server answers with the task's own id,
// so a key of ours is never mistaken for one the shared list handed out.
export const LOCAL_ID_PREFIX = "local-";

export const THICK = `3px solid ${brand.primaryColor}`;
export const HAIRLINE = `1px solid ${brand.primaryColor}`;

export const FOCUS_RING =
  "focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2";
