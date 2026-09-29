import { vi } from "vitest";
import { seeds, seedInterviews, seedTasks } from "./fixtures";

export function mockApi() {
  const data = structuredClone({
    apps: seeds,
    interviews: seedInterviews,
    tasks: seedTasks,
  });
  const respond = (body, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));
  const fetch = vi.fn((path, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : null;
    if (path === "/api/csrf")
      return respond({ headerName: "X-CSRF-TOKEN", token: "test-token" });
    if (path === "/api/me")
      return respond({ name: "Sarth Kumar", email: "test@example.com" });
    if (path === "/api/gmail")
      return respond({ connected: false, suggestions: [] });
    if (path === "/api/workspace") return respond(data);
    if (path === "/api/logout")
      return Promise.resolve(new Response(null, { status: 204 }));
    if (options.headers?.["X-CSRF-TOKEN"] !== "test-token")
      return respond({}, 403);
    if (path === "/api/applications") {
      const saved = {
        ...body,
        id: crypto.randomUUID(),
        history: [{ stage: body.stage, date: body.date }],
      };
      data.apps.unshift(saved);
      return respond(saved, 201);
    }
    const application = path.match(
      /^\/api\/applications\/([^/]+)\/(stage|notes)$/,
    );
    if (application) {
      const saved = data.apps.find((item) => item.id === application[1]);
      Object.assign(saved, body);
      return respond(saved);
    }
    if (path === "/api/interviews" || path === "/api/tasks") {
      const saved = {
        ...body,
        id: crypto.randomUUID(),
        ...(path.endsWith("tasks") ? { done: false } : {}),
      };
      data[path.endsWith("tasks") ? "tasks" : "interviews"].push(saved);
      return respond(saved, 201);
    }
    if (path.startsWith("/api/tasks/")) {
      const saved = data.tasks.find(
        (item) => item.id === path.split("/").pop(),
      );
      Object.assign(saved, body);
      return respond(saved);
    }
    return respond({}, 404);
  });
  vi.stubGlobal("fetch", fetch);
  return { fetch, data };
}
