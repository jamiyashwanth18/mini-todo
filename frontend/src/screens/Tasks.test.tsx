import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Tasks from "./Tasks";

const FORBIDDEN_FIELDS = /due date|priority|category|description/i;

describe("Tasks — minimal task data", () => {
  it("[AC-005] records only a title, a done status and a creation time for a new task", async () => {
    const user = userEvent.setup();
    render(<Tasks />);

    await user.type(screen.getByTestId("title-max-100-characters-input"), "Water the plants");
    await user.click(screen.getByTestId("add-task-btn"));

    const rows = within(screen.getByTestId("tasks-newest-first-list")).getAllByRole("listitem");
    const added = rows[0];
    expect(within(added).getByRole("heading", { name: "Water the plants" })).toBeInTheDocument();
    expect(within(added).getByText("Not done")).toBeInTheDocument();
    expect(within(added).getByText("2026-11-25 10:00")).toBeInTheDocument();
    expect(added.textContent ?? "").not.toMatch(FORBIDDEN_FIELDS);
  });

  it("[AC-005] offers a title field only when adding a task", () => {
    render(<Tasks />);

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
    render(<Tasks />);

    const before = within(screen.getByTestId("tasks-newest-first-list")).getAllByRole("listitem");
    await user.click(screen.getByTestId("add-task-btn"));

    expect(screen.getByText("A title is required")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("tasks-newest-first-list")).getAllByRole("listitem"),
    ).toHaveLength(before.length);
  });

  it("[AC-006] offers no edit control for a task that already exists", () => {
    render(<Tasks />);

    const list = screen.getByTestId("tasks-newest-first-list");
    expect(within(list).queryAllByRole("button", { name: /edit|rename/i })).toHaveLength(0);
    expect(within(list).queryAllByRole("textbox")).toHaveLength(0);
    expect(list.querySelectorAll("input, textarea")).toHaveLength(0);
    expect(list.textContent ?? "").not.toMatch(/edit|rename/i);
  });

  it("[AC-006] keeps an existing title as read-only text when it is clicked", async () => {
    const user = userEvent.setup();
    render(<Tasks />);

    const title = screen.getByRole("heading", { name: "Buy milk" });
    await user.dblClick(title);

    expect(title.tagName).toBe("H3");
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Buy milk" })).toBeInTheDocument();
  });

  it("[AC-006] supports only add, mark done and delete on a task row", async () => {
    const user = userEvent.setup();
    render(<Tasks />);

    const row = within(screen.getByTestId("tasks-newest-first-list")).getAllByRole("listitem")[0];
    const names = within(row)
      .getAllByRole("button")
      .map((button) => (button.textContent ?? "").trim());
    expect(names).toEqual(["Mark done", "Delete"]);

    await user.click(within(row).getByTestId("mark-done-btn"));
    expect(within(row).getByTestId("mark-not-done-btn")).toBeInTheDocument();
  });

  it("[AC-006] deletes a task through its confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<Tasks />);

    const row = within(screen.getByTestId("tasks-newest-first-list")).getAllByRole("listitem")[0];
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
    render(<Tasks />);

    for (let i = 0; i < 3; i += 1) {
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
    render(<Tasks />);

    const row = within(screen.getByTestId("tasks-newest-first-list")).getAllByRole("listitem")[0];
    await user.click(within(row).getByTestId("delete-btn"));
    await user.click(
      within(screen.getByTestId("delete-this-task-modal")).getByTestId("cancel-btn"),
    );

    expect(screen.queryByTestId("delete-this-task-modal")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Submit expense report" })).toBeInTheDocument();
  });
});
