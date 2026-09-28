import { mockApi } from "./mock-api";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { getToday } from "../src/lib/dates";

let server;
beforeEach(() => {
  server = mockApi();
});

async function renderApp() {
  const view = render(<App />);
  await screen.findByText("Application pipeline");
  return view;
}

function navigate(user, name) {
  return user.click(
    screen.getByRole("button", { name: new RegExp(`^${name}`) }),
  );
}

describe("JobTrack workflows", () => {
  it("keeps Overview focused on the pipeline and opens a filtered application list", async () => {
    const user = userEvent.setup();
    await renderApp();
    expect(screen.getByText("Application pipeline")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "View interview applications" }),
    );
    expect(screen.getByLabelText("Filter by stage")).toHaveTextContent(
      "Interview",
    );
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("adds an application and links a new interview to it", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Add application" }));
    let dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Company *"), "Test Company");
    await user.type(within(dialog).getByLabelText("Role *"), "Java Developer");
    expect(within(dialog).getByLabelText("Date added *")).toHaveValue(
      getToday(),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save application" }),
    );
    await screen.findByText("Application added");
    await navigate(user, "Applications");
    await user.click(screen.getByRole("button", { name: "View Test Company" }));
    dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByLabelText("Change stage"));
    await user.click(screen.getByRole("option", { name: "Screening" }));
    expect(within(dialog).getAllByText("Screening").length).toBeGreaterThan(0);
    await user.type(
      within(dialog).getByLabelText("Job description / notes"),
      "Prepare API examples",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save notes" }),
    );
    await screen.findByText("Notes saved");
    await user.click(
      within(dialog).getByRole("button", { name: "Schedule interview" }),
    );
    dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByLabelText("Interview round *"),
      "API review",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save interview" }),
    );
    await screen.findByText("Interview scheduled");
    await navigate(user, "Interviews");
    const card = screen
      .getByRole("heading", { name: "API review" })
      .closest("article");
    expect(within(card).getByText("Test Company")).toBeInTheDocument();
  });

  it("moves a follow-up between pending and completed", async () => {
    const user = userEvent.setup();
    await renderApp();
    await navigate(user, "Follow-ups");
    await user.click(
      screen.getByRole("checkbox", {
        name: "Complete Follow up with the recruiter",
      }),
    );
    expect(
      screen.queryByRole("checkbox", {
        name: "Complete Follow up with the recruiter",
      }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /Completed/ }));
    expect(
      screen.getByRole("checkbox", {
        name: "Complete Follow up with the recruiter",
      }),
    ).toBeChecked();
  });

  it("persists dark mode across remounts", async () => {
    const user = userEvent.setup();
    const view = await renderApp();
    await navigate(user, "Settings");
    await user.click(screen.getByRole("switch", { name: /Dark mode/ }));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem("jobtrack-theme")).toBe("dark");
    view.unmount();
    await renderApp();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("rejects a non-web link without saving the application", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Add application" }));
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByLabelText("Company *"),
      "Unsafe Company",
    );
    await user.type(within(dialog).getByLabelText("Role *"), "Developer");
    await user.type(
      within(dialog).getByLabelText("Job link"),
      "javascript:alert(1)",
    );
    fireEvent.submit(
      within(dialog)
        .getByRole("button", { name: "Save application" })
        .closest("form"),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      await screen.findByText("Use a link starting with https:// or http://"),
    ).toBeInTheDocument();
  });
  it("closes the mobile menu after navigating", async () => {
    window.matchMedia.mockReturnValue({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    const user = userEvent.setup();
    const view = await renderApp();
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const menu = screen.getByRole("dialog", { name: "Workspace navigation" });
    await user.click(
      within(menu).getByRole("button", { name: /^Applications/ }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Workspace navigation" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Applications" }),
    ).toBeInTheDocument();
    view.unmount();
    window.matchMedia.mockReturnValue({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  });
  it("requires Google sign-in when there is no session", async () => {
    server.fetch.mockResolvedValue(new Response("{}", { status: 401 }));
    render(<App />);
    expect(
      await screen.findByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("href", "/oauth2/authorization/google");
    expect(screen.queryByText("Application pipeline")).not.toBeInTheDocument();
  });

  it("keeps a failed application save open without adding a phantom entry", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Add application" }));
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByLabelText("Company *"),
      "Failed Company",
    );
    await user.type(within(dialog).getByLabelText("Role *"), "Developer");
    const previous = server.fetch.getMockImplementation();
    server.fetch.mockImplementation((path, options) =>
      path === "/api/applications"
        ? Promise.resolve(
            new Response(JSON.stringify({ detail: "Database unavailable" }), {
              status: 503,
            }),
          )
        : previous(path, options),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save application" }),
    );
    expect(await screen.findByText("Database unavailable")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(server.data.apps).toHaveLength(8);
  });
});
