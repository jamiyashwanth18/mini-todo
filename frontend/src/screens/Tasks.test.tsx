import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/client";

import Tasks from "./Tasks";

vi.mock("@/api/client", () => ({ api: { GET: vi.fn() } }));

type ApiTask = { id: string; title: string; done: boolean; createdAt: string };

const listTasks = vi.mocked(api.GET as unknown as (path: string) => Promise<unknown>);

const TASKS: ApiTask[] = [
  { id: "tsk_4812", title: "Submit expense report", done: false, createdAt: "2026-11-25T09:58:00" },
  { id: "tsk_4809", title: "Buy milk", done: false, createdAt: "2026-11-25T09:42:00" },
  {
    id: "tsk_4791",
    title: "Book dentist appointment",
    done: true,
    createdAt: "2026-11-24T16:20:00",
  },
];

function serverReturns(tasks: ApiTask[]) {
  listTasks.mockResolvedValue({ data: tasks, error: undefined });
}

function serverFails() {
  listTasks.mockResolvedValue({ data: undefined, error: { detail: "down" } });
}

async function renderList(tasks: ApiTask[] = TASKS) {
  serverReturns(tasks);
  render(<Tasks />);
  return await screen.findByTestId("tasks-newest-first-list");
}

function titlesOf(list: HTMLElement) {
  return within(list)
    .getAllByRole("heading")
    .map((heading) => (heading.textContent ?? "").trim());
}

beforeEach(() => {
  listTasks.mockReset();
  serverReturns(TASKS);
});

describe("Tasks — newest-first list", () => {
  it("[AC-007] shows every task of the shared list ordered newest-first", async () => {
    const list = await renderList([TASKS[1], TASKS[2], TASKS[0]]);

    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(titlesOf(list)).toEqual([
      "Submit expense report",
      "Buy milk",
      "Book dentist appointment",
    ]);
  });

  it("[AC-007] reads the list from the shared tasks endpoint", async () => {
    await renderList();

    expect(listTasks).toHaveBeenCalledWith("/tasks");
  });

  it("[AC-007] shows no list and no empty state while the tasks are loading", async () => {
    serverReturns(TASKS);
    render(<Tasks />);

    expect(screen.queryByTestId("tasks-newest-first-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("no-tasks-yet-empty")).not.toBeInTheDocument();

    expect(await screen.findByTestId("tasks-newest-first-list")).toBeInTheDocument();
  });

  it("[AC-007] shows the empty state when no task exists", async () => {
    serverReturns([]);
    render(<Tasks />);

    const empty = await screen.findByTestId("no-tasks-yet-empty");
    expect(within(empty).getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.queryByTestId("tasks-newest-first-list")).not.toBeInTheDocument();
  });

  it("[AC-007] reports a failed load instead of showing an empty list", async () => {
    serverFails();
    render(<Tasks />);

    expect(await screen.findByText("Tasks could not be loaded")).toBeInTheDocument();
    expect(screen.queryByTestId("tasks-newest-first-list")).not.toBeInTheDocument();
    expect(screen.queryByTestId("no-tasks-yet-empty")).not.toBeInTheDocument();
  });

  it("[AC-008] keeps a done task in place in the newest-first order", async () => {
    const list = await renderList([
      { id: "tsk_1", title: "Oldest and not done", done: false, createdAt: "2026-11-24T08:00:00" },
      { id: "tsk_2", title: "Newest and done", done: true, createdAt: "2026-11-25T11:00:00" },
      { id: "tsk_3", title: "Middle and not done", done: false, createdAt: "2026-11-25T09:00:00" },
    ]);

    expect(titlesOf(list)).toEqual([
      "Newest and done",
      "Middle and not done",
      "Oldest and not done",
    ]);
  });

  it("[AC-008] shows done tasks struck through and not-done tasks normally", async () => {
    const list = await renderList();

    const done = within(list).getByRole("heading", { name: "Book dentist appointment" });
    const notDone = within(list).getByRole("heading", { name: "Buy milk" });
    expect(done.style.textDecoration).toBe("line-through");
    expect(notDone.style.textDecoration).toBe("none");
  });

  it("[AC-008] hides no done task and marks its status in the one shared list", async () => {
    const list = await renderList();

    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(TASKS.length);
    const doneRow = rows[2];
    expect(within(doneRow).getByRole("heading", { name: "Book dentist appointment" }));
    expect(within(doneRow).getByText("Done")).toBeInTheDocument();
    expect(within(doneRow).getByTestId("mark-not-done-btn")).toBeInTheDocument();
  });
});

const FORBIDDEN_FIELDS = /due date|priority|category|description/i;

describe("Tasks — minimal task data", () => {
  it("[AC-005] records only a title, a done status and a creation time for a new task", async () => {
    const user = userEvent.setup();
    const list = await renderList();

    await user.type(screen.getByTestId("title-max-100-characters-input"), "Water the plants");
    await user.click(screen.getByTestId("add-task-btn"));

    const added = within(list).getAllByRole("listitem")[0];
    expect(within(added).getByRole("heading", { name: "Water the plants" })).toBeInTheDocument();
    expect(within(added).getByText("Not done")).toBeInTheDocument();
    expect(within(added).getByText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(added.textContent ?? "").not.toMatch(FORBIDDEN_FIELDS);
  });

  it("[AC-005] offers a title field only when adding a task", async () => {
    await renderList();

    const form = screen.getByTestId("add-a-task-form");
    const fields = within(form).getAllByRole("textbox");
    expect(fields).toHaveLength(1);
    expect(fields[0]).toBe(screen.getByTestId("title-max-100-characters-input"));
    expect(within(form).queryAllByRole("combobox")).toHaveLength(0);
    expect(form.querySelectorAll("input")).toHaveLength(1);
    expect(form.textContent ?? "").not.toMatch(FORBIDDEN_FIELDS);
    expect(screen.getByText(/Maximum 100 characters/)).toBeInTheDocument();
  });

  it("[AC-005] shows the required-title message instead of storing an empty task", async () => {
    const user = userEvent.setup();
    const list = await renderList();

    const before = within(list).getAllByRole("listitem");
    await user.click(screen.getByTestId("add-task-btn"));

    expect(screen.getByText("A title is required")).toBeInTheDocument();
    expect(within(list).getAllByRole("listitem")).toHaveLength(before.length);
  });

  it("[AC-006] offers no edit control for a task that already exists", async () => {
    const list = await renderList();

    expect(within(list).queryAllByRole("button", { name: /edit|rename/i })).toHaveLength(0);
    expect(within(list).queryAllByRole("textbox")).toHaveLength(0);
    expect(list.querySelectorAll("input, textarea")).toHaveLength(0);
    expect(list.textContent ?? "").not.toMatch(/edit|rename/i);
  });

  it("[AC-006] keeps an existing title as read-only text when it is clicked", async () => {
    const user = userEvent.setup();
    await renderList();

    const title = screen.getByRole("heading", { name: "Buy milk" });
    await user.dblClick(title);

    expect(title.tagName).toBe("H3");
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Buy milk" })).toBeInTheDocument();
  });

  it("[AC-006] supports only add, mark done and delete on a task row", async () => {
    const user = userEvent.setup();
    const list = await renderList();

    const row = within(list).getAllByRole("listitem")[0];
    const names = within(row)
      .getAllByRole("button")
      .map((button) => (button.textContent ?? "").trim());
    expect(names).toEqual(["Mark done", "Delete"]);

    await user.click(within(row).getByTestId("mark-done-btn"));
    expect(within(row).getByTestId("mark-not-done-btn")).toBeInTheDocument();
  });

  it("[AC-006] deletes a task through its confirmation dialog", async () => {
    const user = userEvent.setup();
    const list = await renderList();

    const row = within(list).getAllByRole("listitem")[0];
    await user.click(within(row).getByTestId("delete-btn"));

    const modal = screen.getByTestId("delete-this-task-modal");
    expect(within(modal).getByText("Delete this task?")).toBeInTheDocument();
    await user.click(within(modal).getByTestId("delete-task-btn"));

    expect(screen.getByText("Task deleted")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Submit expense report" }),
    ).not.toBeInTheDocument();
  });

  it("[AC-006] shows the empty state once every task is deleted", async () => {
    const user = userEvent.setup();
    await renderList();

    for (let i = 0; i < TASKS.length; i += 1) {
      const rows = within(screen.getByTestId("tasks-newest-first-list")).getAllByRole("listitem");
      await user.click(within(rows[0]).getByTestId("delete-btn"));
      await user.click(
        within(screen.getByTestId("delete-this-task-modal")).getByTestId("delete-task-btn"),
      );
    }

    const empty = screen.getByTestId("no-tasks-yet-empty");
    expect(within(empty).getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.queryByTestId("tasks-newest-first-list")).not.toBeInTheDocument();
  });

  it("[AC-006] closes the delete dialog without deleting when cancelled", async () => {
    const user = userEvent.setup();
    const list = await renderList();

    const row = within(list).getAllByRole("listitem")[0];
    await user.click(within(row).getByTestId("delete-btn"));
    await user.click(
      within(screen.getByTestId("delete-this-task-modal")).getByTestId("cancel-btn"),
    );

    expect(screen.queryByTestId("delete-this-task-modal")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Submit expense report" })).toBeInTheDocument();
  });
});

describe("Tasks — empty state", () => {
  it("[AC-009] shows the 'No tasks yet' empty state when the shared list has no tasks", async () => {
    serverReturns([]);
    render(<Tasks />);

    const empty = await screen.findByTestId("no-tasks-yet-empty");
    expect(within(empty).getByText("No tasks yet")).toBeInTheDocument();
  });

  it("[AC-009] shows no task list and no load error alongside the empty state", async () => {
    serverReturns([]);
    render(<Tasks />);

    await screen.findByTestId("no-tasks-yet-empty");
    expect(screen.queryByTestId("tasks-newest-first-list")).not.toBeInTheDocument();
    expect(screen.queryByText("Tasks could not be loaded")).not.toBeInTheDocument();
  });

  it("[AC-010] replaces the empty state with the list containing the first added task", async () => {
    const user = userEvent.setup();
    serverReturns([]);
    render(<Tasks />);
    await screen.findByTestId("no-tasks-yet-empty");

    await user.type(screen.getByTestId("title-max-100-characters-input"), "Buy milk");
    await user.click(screen.getByTestId("add-task-btn"));

    expect(screen.queryByTestId("no-tasks-yet-empty")).not.toBeInTheDocument();
    const list = screen.getByTestId("tasks-newest-first-list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(within(list).getByRole("heading", { name: "Buy milk" })).toBeInTheDocument();
  });

  it("[AC-010] keeps the empty state when the add is refused for a missing title", async () => {
    const user = userEvent.setup();
    serverReturns([]);
    render(<Tasks />);
    await screen.findByTestId("no-tasks-yet-empty");

    await user.click(screen.getByTestId("add-task-btn"));

    expect(screen.getByText("A title is required")).toBeInTheDocument();
    expect(screen.getByTestId("no-tasks-yet-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("tasks-newest-first-list")).not.toBeInTheDocument();
  });
});

describe("Tasks — one global list shared by every visitor", () => {
  it("[AC-011] reads the one shared list with no visitor or session identifier", async () => {
    await renderList();

    expect(listTasks.mock.calls).toEqual([["/tasks"]]);
  });

  it("[AC-011] shows another visitor's task on a fresh session opening the app", async () => {
    const user = userEvent.setup();
    serverReturns([]);
    const firstVisitor = render(<Tasks />);
    await screen.findByTestId("no-tasks-yet-empty");

    await user.type(screen.getByTestId("title-max-100-characters-input"), "Refill the printer");
    await user.click(screen.getByTestId("add-task-btn"));
    expect(
      within(screen.getByTestId("tasks-newest-first-list")).getByRole("heading", {
        name: "Refill the printer",
      }),
    ).toBeInTheDocument();
    firstVisitor.unmount();

    serverReturns([
      {
        id: "tsk_5001",
        title: "Refill the printer",
        done: false,
        createdAt: "2026-11-25T10:05:00",
      },
      ...TASKS,
    ]);
    render(<Tasks />);

    const list = await screen.findByTestId("tasks-newest-first-list");
    expect(titlesOf(list)).toEqual([
      "Refill the printer",
      "Submit expense report",
      "Buy milk",
      "Book dentist appointment",
    ]);
  });

  it("[AC-012] offers mark done and delete on every task of the shared list", async () => {
    const list = await renderList();

    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(TASKS.length);
    for (const row of rows) {
      expect(
        within(row).queryByTestId("mark-done-btn") ?? within(row).getByTestId("mark-not-done-btn"),
      ).toBeInTheDocument();
      expect(within(row).getByTestId("delete-btn")).toBeEnabled();
    }
  });

  it("[AC-012] marks a task added by another visitor done and not done again", async () => {
    const user = userEvent.setup();
    const list = await renderList();

    const row = within(list).getAllByRole("listitem")[1];
    expect(within(row).getByRole("heading", { name: "Buy milk" })).toBeInTheDocument();

    await user.click(within(row).getByTestId("mark-done-btn"));
    expect(within(row).getByText("Done")).toBeInTheDocument();

    await user.click(within(row).getByTestId("mark-not-done-btn"));
    expect(within(row).getByText("Not done")).toBeInTheDocument();
  });

  it("[AC-012] deletes a task added by another visitor from the shared list", async () => {
    const user = userEvent.setup();
    const list = await renderList();

    const row = within(list).getAllByRole("listitem")[2];
    await user.click(within(row).getByTestId("delete-btn"));

    const modal = screen.getByTestId("delete-this-task-modal");
    expect(within(modal).getByText("Delete this task?")).toBeInTheDocument();
    await user.click(within(modal).getByTestId("delete-task-btn"));

    expect(screen.getByText("Task deleted")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Book dentist appointment" }),
    ).not.toBeInTheDocument();
    expect(titlesOf(screen.getByTestId("tasks-newest-first-list"))).toEqual([
      "Submit expense report",
      "Buy milk",
    ]);
  });

  it("[AC-012] asks for no sign-in and shows no ownership on the shared list", async () => {
    await renderList();

    expect(
      screen.queryByRole("button", { name: /sign in|sign up|log in|log out|sign out/i }),
    ).not.toBeInTheDocument();
    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(0);
    expect(document.body.textContent ?? "").not.toMatch(/owner|my tasks|your tasks|account/i);
  });
});

const TITLES = ["Submit expense report", "Buy milk", "Book dentist appointment"];

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

describe("Tasks — the list persists across sessions and devices", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("[AC-020] reads the persisted list from the server every time the app is opened", async () => {
    const firstOpen = render(<Tasks />);
    expect(titlesOf(await screen.findByTestId("tasks-newest-first-list"))).toEqual(TITLES);
    firstOpen.unmount();

    render(<Tasks />);
    expect(titlesOf(await screen.findByTestId("tasks-newest-first-list"))).toEqual(TITLES);
    expect(listTasks.mock.calls).toEqual([["/tasks"], ["/tasks"]]);
  });

  it("[AC-020] shows the same tasks when the app is closed and reopened in a new session", async () => {
    const session = render(<Tasks />);
    await screen.findByTestId("tasks-newest-first-list");
    session.unmount();

    // A new session: the browser kept nothing from the closed one.
    window.localStorage.clear();
    window.sessionStorage.clear();

    render(<Tasks />);
    expect(titlesOf(await screen.findByTestId("tasks-newest-first-list"))).toEqual(TITLES);
  });

  it("[AC-020] shows the server's list rather than a stale locally cached one", async () => {
    window.localStorage.setItem(
      "tasks",
      JSON.stringify([
        { id: "tsk_old", title: "Stale local copy", done: false, createdAt: "2026-11-20T08:00:00" },
      ]),
    );

    render(<Tasks />);

    expect(titlesOf(await screen.findByTestId("tasks-newest-first-list"))).toEqual(TITLES);
    expect(screen.queryByRole("heading", { name: "Stale local copy" })).not.toBeInTheDocument();
  });

  it("[AC-021] shows the persisted list on a device that has no local data", async () => {
    expect(storedValues()).toBe("");

    render(<Tasks />);

    expect(titlesOf(await screen.findByTestId("tasks-newest-first-list"))).toEqual(TITLES);
    expect(listTasks).toHaveBeenCalledWith("/tasks");
  });

  it("[AC-021] shows a task added on one device when another device loads the list", async () => {
    const user = userEvent.setup();
    const deviceA = render(<Tasks />);
    await screen.findByTestId("tasks-newest-first-list");

    await user.type(
      screen.getByTestId("title-max-100-characters-input"),
      "Pack the laptop charger",
    );
    await user.click(screen.getByTestId("add-task-btn"));
    deviceA.unmount();

    // Another device: nothing stored locally, the server answers with the persisted list.
    window.localStorage.clear();
    window.sessionStorage.clear();
    serverReturns([
      {
        id: "tsk_5100",
        title: "Pack the laptop charger",
        done: false,
        createdAt: "2026-11-25T10:10:00",
      },
      ...TASKS,
    ]);
    render(<Tasks />);

    expect(titlesOf(await screen.findByTestId("tasks-newest-first-list"))).toEqual([
      "Pack the laptop charger",
      ...TITLES,
    ]);
  });

  it("[AC-021] keeps no copy of the shared list in browser storage", async () => {
    await renderList();

    expect(storedValues()).not.toMatch(/Buy milk|Submit expense report/);
  });
});
