const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const REQUEST_TIMEOUT = 15000;

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshTokenValue =
      typeof window !== "undefined"
        ? localStorage.getItem("refresh_token")
        : null;
    if (!refreshTokenValue) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return false;
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return "خطا در اتصال به سرور";
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return "درخواست با خطا مواجه شد (Timeout)";
  }
  if (err instanceof Error) return err.message;
  return "خطای ناشناخته";
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  let token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    let res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (res.status === 401 && !endpoint.includes("/refresh")) {
      const refreshed = await refreshToken();
      if (refreshed) {
        token = localStorage.getItem("access_token");
        headers["Authorization"] = `Bearer ${token}`;
        res = await fetch(url, { ...options, headers, signal: controller.signal });
      } else {
        const { logout } = await import("@/lib/auth");
        logout();
        throw new Error("نشست شما منقضی شده است. لطفا مجددا وارد شوید.");
      }
    }

    if (!res.ok) {
      let detail = `خطای ${res.status}`;
      try {
        const errorBody = await res.json();
        detail = errorBody.detail || detail;
      } catch {
        // use default detail
      }
      throw new Error(detail);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const data = await res.json();
    return data as T;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: "DELETE",
    }),
};
