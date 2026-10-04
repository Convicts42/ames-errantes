import { api as workspaceApi } from "../api";

// Use the intranet's error handling and session for the management endpoints.
export function api(url, { method = "GET", data } = {}) {
  return workspaceApi(url, {
    method,
    body: data,
  });
}
