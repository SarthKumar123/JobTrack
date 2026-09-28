export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = "GET", body, signal } = {}) {
  const headers = {};
  if (method !== "GET") {
    const csrf = await api("/api/csrf", { signal });
    headers[csrf.headerName] = csrf.token;
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    signal,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status === 401
        ? "Your session expired. Please sign in again."
        : problem.detail || "Could not save your changes. Please try again.",
      response.status,
    );
  }
  return response.status === 204 ? null : response.json();
}
