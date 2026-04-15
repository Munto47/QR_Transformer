import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearAdminToken } from "./authStorage";

export const api = axios.create({
  baseURL: "/api",
  timeout: 60000,
});

const ADMIN_LOGOUT_EVENT = "qr-admin-unauthorized";

function hasAuthorizationHeader(
  config: InternalAxiosRequestConfig | undefined
): boolean {
  if (!config?.headers) return false;
  const h = config.headers;
  if (typeof h.get === "function") {
    return Boolean(h.get("Authorization") || h.get("authorization"));
  }
  const rec = h as Record<string, string | undefined>;
  return Boolean(rec.Authorization || rec.authorization);
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      isAxiosError(err) &&
      err.response?.status === 401 &&
      hasAuthorizationHeader(err.config)
    ) {
      clearAdminToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(ADMIN_LOGOUT_EVENT));
      }
    }
    return Promise.reject(err);
  }
);

export function subscribeAdminUnauthorized(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(ADMIN_LOGOUT_EVENT, handler);
  return () => window.removeEventListener(ADMIN_LOGOUT_EVENT, handler);
}

