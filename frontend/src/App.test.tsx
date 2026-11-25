import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/client";

import App from "./App";

vi.mock("@/api/client", () => ({ api: { GET: vi.fn() } }));

type ApiTask = { id: string; title: string; done: boolean; createdAt: string };

const listTasks = vi.mocked(api.GET as unknown as (path: string) => Promise<unknown>);

const TASKS: ApiTask[] = [
  { id: "tsk_4812", title: "Submit expense report", done: false, createdAt: "2026-11-25T09:58:00" },
  {
    id: "tsk_4791",
    title: "Book dentist appointment",
    done: true,
    createdAt: "2026-11-24T16:20:00",
  },
];

// Words a sign-in, account or registration barrier would put on the screen.
const SIGN_IN_WORDS =
  /sign in|sign up|signin|signup|log in|login|register|registration|account|password|email address/i;

// Words a payment, billing or subscription request would put on the screen.
const PAYMENT_WORDS =
  /payment|billing|subscribe|subscription|pricing|upgrade|checkout|invoice|credit card|\bpay\b|\bplan\b|\btrial\b/i;

function serverReturns(tasks: ApiTask[]) {
  listTasks.mockResolvedValue({ data: tasks, error: undefined });
}

// Everything the browser kept: a sign-in would leave a session token behind.
function storedValues() {
  const values: string[] = [];
  for (const store of [window.localStorage, window.sessionStorage]) {
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key !== null) values.push(key, store.getItem(key) ?? "");
    }
  }
  return values.join(" ");
}

function pageText() {
  return document.body.textContent ?? "";
}

// A first-time visitor: nothing stored, no token, straight to the app's entry point.
async function openAsFirstTimeVisitor(entry = "/") {
  window.localStorage.clear();
  window.sessionStorage.clear();
  render(
    <MemoryRouter initialEntries={[entry]}>
      <App />
    </MemoryRouter>,
  );
  return await screen.findByTestId("shared-to-do-list-title");
}

beforeEach(() => {
  listTasks.mockReset();
  serverReturns(TASKS);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("App", () => {
  it("renders a screen inside the app shell and shows its menu", () => {
    render(
      <MemoryRouter initialEntries={["/tasks"]}>
        <App />
      </MemoryRouter>,
    );
    // getAllByText, not getByText: the page may repeat its menu item's text.
    expect(screen.getAllByText("Tasks").length).toBeGreaterThan(0);
  });
});

describe("App — anonymous access with no sign-in", () => {
  it("[AC-022] opens the app straight on the todo list for a first-time visitor", async () => {
    await openAsFirstTimeVisitor();

    expect(await screen.findByTestId("tasks-newest-first-list")).toBeInTheDocument();
    expect(screen.getByTestId("add-a-task-form")).toBeInTheDocument();
    expect(pageText()).not.toMatch(SIGN_IN_WORDS);
    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(0);
  });

  it("[AC-022] offers no sign-in, sign-up or registration route anywhere in the shell", async () => {
    await openAsFirstTimeVisitor("/anything-else");

    expect(screen.queryByRole("button", { name: SIGN_IN_WORDS })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: SIGN_IN_WORDS })).not.toBeInTheDocument();
    expect(await screen.findByTestId("tasks-newest-first-list")).toBeInTheDocument();
  });

  it("[AC-022] adds a task immediately on the first visit with no account", async () => {
    const user = userEvent.setup();
    await openAsFirstTimeVisitor();
    await screen.findByTestId("tasks-newest-first-list");

    await user.type(screen.getByTestId("title-max-100-characters-input"), "Refill the printer");
    await user.click(screen.getByTestId("add-task-btn"));

    expect(
      within(screen.getByTestId("tasks-newest-first-list")).getByRole("heading", {
        name: "Refill the printer",
      }),
    ).toBeInTheDocument();
    expect(pageText()).not.toMatch(SIGN_IN_WORDS);
  });

  it("[AC-022] marks any task done and not done again with no sign-in", async () => {
    const user = userEvent.setup();
    await openAsFirstTimeVisitor();
    const list = await screen.findByTestId("tasks-newest-first-list");

    const row = within(list).getAllByRole("listitem")[0];
    await user.click(within(row).getByTestId("mark-done-btn"));
    expect(within(row).getByText("Done")).toBeInTheDocument();

    await user.click(within(row).getByTestId("mark-not-done-btn"));
    expect(within(row).getByText("Not done")).toBeInTheDocument();
    expect(pageText()).not.toMatch(SIGN_IN_WORDS);
  });

  it("[AC-022] deletes any task with no sign-in", async () => {
    const user = userEvent.setup();
    await openAsFirstTimeVisitor();
    const list = await screen.findByTestId("tasks-newest-first-list");

    const row = within(list).getAllByRole("listitem")[1];
    await user.click(within(row).getByTestId("delete-btn"));

    const modal = screen.getByTestId("delete-this-task-modal");
    expect(within(modal).getByText("Delete this task?")).toBeInTheDocument();
    await user.click(within(modal).getByTestId("delete-task-btn"));

    expect(screen.getByText("Task deleted")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Book dentist appointment" }),
    ).not.toBeInTheDocument();
    expect(pageText()).not.toMatch(SIGN_IN_WORDS);
  });

  it("[AC-022] reads the list with no credential and keeps no session behind", async () => {
    const user = userEvent.setup();
    await openAsFirstTimeVisitor();
    await screen.findByTestId("tasks-newest-first-list");

    await user.type(screen.getByTestId("title-max-100-characters-input"), "Water the plants");
    await user.click(screen.getByTestId("add-task-btn"));

    // The one call carries the path only: no token, no visitor identity.
    expect(listTasks.mock.calls).toEqual([["/tasks"]]);
    expect(storedValues()).toBe("");
  });
});

describe("App — the app is free with no payment", () => {
  it("[AC-023] asks for no payment, billing or subscription on the first visit", async () => {
    await openAsFirstTimeVisitor();
    await screen.findByTestId("tasks-newest-first-list");

    expect(pageText()).not.toMatch(PAYMENT_WORDS);
    expect(screen.queryByRole("button", { name: PAYMENT_WORDS })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: PAYMENT_WORDS })).not.toBeInTheDocument();
  });

  it("[AC-023] asks for no payment after adding, marking done and deleting a task", async () => {
    const user = userEvent.setup();
    await openAsFirstTimeVisitor();
    const list = await screen.findByTestId("tasks-newest-first-list");

    await user.type(screen.getByTestId("title-max-100-characters-input"), "Sort the recycling");
    await user.click(screen.getByTestId("add-task-btn"));
    expect(pageText()).not.toMatch(PAYMENT_WORDS);

    const row = within(screen.getByTestId("tasks-newest-first-list")).getAllByRole("listitem")[0];
    await user.click(within(row).getByTestId("mark-done-btn"));
    expect(pageText()).not.toMatch(PAYMENT_WORDS);

    await user.click(within(row).getByTestId("delete-btn"));
    await user.click(
      within(screen.getByTestId("delete-this-task-modal")).getByTestId("delete-task-btn"),
    );

    expect(screen.getByText("Task deleted")).toBeInTheDocument();
    expect(pageText()).not.toMatch(PAYMENT_WORDS);
    expect(within(list).getAllByRole("listitem")).toHaveLength(TASKS.length);
  });

  it("[AC-023] shows no payment barrier on the empty list either", async () => {
    serverReturns([]);
    await openAsFirstTimeVisitor();

    const empty = await screen.findByTestId("no-tasks-yet-empty");
    expect(within(empty).getByText("No tasks yet")).toBeInTheDocument();
    expect(pageText()).not.toMatch(PAYMENT_WORDS);
    expect(pageText()).not.toMatch(SIGN_IN_WORDS);
  });
});
