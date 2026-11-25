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
