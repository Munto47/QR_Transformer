const ADMIN_TOKEN_KEY = "qr-admin-token";

export function getAdminToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}
