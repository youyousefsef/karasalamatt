export interface AuthData {
  access_token: string;
  role: string;
  phone_number: string;
  refresh_token?: string;
}

export function saveAuth(data: AuthData): void {
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("phone_number", data.phone_number);
  if (data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");
  localStorage.removeItem("phone_number");
  window.location.href = "/";
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
