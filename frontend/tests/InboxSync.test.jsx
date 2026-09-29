import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InboxSync from "../src/components/InboxSync";
import { api } from "../src/lib/api";

vi.mock("../src/lib/api", () => ({ api: vi.fn() }));
const suggestion = {
  id: "mail-1",
  subject: "Interview invitation",
  sender: "Hiring",
  snippet: "Schedule an interview",
  stage: "Interview",
  reason: "Interview phrase found.",
  date: "2026-09-29",
};
const apps = [
  { id: "app-1", company: "Acme", role: "Java Developer", stage: "Applied" },
];
beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState(null, "", "/");
  api.mockResolvedValue({ connected: true, suggestions: [suggestion] });
});
it("shows a suggestion without changing an application until explicitly approved", async () => {
  const approved = vi.fn();
  const user = userEvent.setup();
  render(<InboxSync apps={apps} onApproved={approved} />);
  await screen.findByText("Interview invitation");
  expect(approved).not.toHaveBeenCalled();
  expect(api).toHaveBeenCalledTimes(1);
  await user.selectOptions(screen.getByLabelText("Application"), "app-1");
  await user.selectOptions(screen.getByLabelText("Stage to save"), "Screening");
  api.mockResolvedValueOnce({ ...apps[0], stage: "Screening" });
  await user.click(
    screen.getByRole("button", { name: "Approve stage change" }),
  );
  expect(api).toHaveBeenLastCalledWith(
    "/api/gmail/suggestions/mail-1/approve",
    { method: "POST", body: { appId: "app-1", stage: "Screening" } },
  );
  expect(approved).toHaveBeenCalledWith({ ...apps[0], stage: "Screening" });
  expect(screen.queryByText("Interview invitation")).not.toBeInTheDocument();
});
it("creates an application from user-entered company and role", async () => {
  const approved = vi.fn();
  const user = userEvent.setup();
  render(<InboxSync apps={[]} onApproved={approved} />);
  await screen.findByText("Interview invitation");
  await user.type(screen.getByLabelText("Company"), "Acme");
  await user.type(screen.getByLabelText("Role"), "Developer");
  api.mockResolvedValueOnce({ id: "new", company: "Acme" });
  await user.click(
    screen.getByRole("button", { name: "Approve new application" }),
  );
  expect(api).toHaveBeenLastCalledWith(
    "/api/gmail/suggestions/mail-1/approve",
    expect.objectContaining({
      body: expect.objectContaining({
        application: expect.objectContaining({
          company: "Acme",
          role: "Developer",
        }),
      }),
    }),
  );
  expect(approved).toHaveBeenCalledTimes(1);
});
it("retains the suggestion after an API error and allows dismissal", async () => {
  const approved = vi.fn();
  const user = userEvent.setup();
  render(<InboxSync apps={apps} onApproved={approved} />);
  await screen.findByText("Interview invitation");
  await user.selectOptions(screen.getByLabelText("Application"), "app-1");
  api.mockRejectedValueOnce(new Error("Could not save"));
  await user.click(
    screen.getByRole("button", { name: "Approve stage change" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not save");
  expect(screen.getByText("Interview invitation")).toBeInTheDocument();
  expect(approved).not.toHaveBeenCalled();
  api.mockResolvedValueOnce(null);
  await user.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(api).toHaveBeenLastCalledWith(
    "/api/gmail/suggestions/mail-1/dismiss",
    { method: "POST" },
  );
  expect(screen.queryByText("Interview invitation")).not.toBeInTheDocument();
});
it("disconnects and clears previews while retaining applications", async () => {
  const approved = vi.fn();
  const user = userEvent.setup();
  render(<InboxSync apps={apps} onApproved={approved} />);
  await screen.findByText("Interview invitation");
  api.mockResolvedValueOnce(null);
  await user.click(
    screen.getByRole("button", { name: "Disconnect & clear emails" }),
  );
  expect(api).toHaveBeenLastCalledWith("/api/gmail", { method: "DELETE" });
  expect(
    screen.getByRole("button", { name: "Connect Gmail" }),
  ).toBeInTheDocument();
  expect(approved).not.toHaveBeenCalled();
});
