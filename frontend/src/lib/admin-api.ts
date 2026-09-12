export class AdminApiError extends Error {}

interface AdminFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function adminFetch<T = unknown>(path: string, options: AdminFetchOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const isFormData = body instanceof FormData;
  const init: RequestInit = {
    ...rest,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  };

  const res = await fetch(`/admin/api/${path}`, init);

  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new AdminApiError("unauthorized");
  }

  if (!res.ok) {
    const message = await res
      .json()
      .then((data) => data?.error)
      .catch(() => undefined);
    throw new AdminApiError(message || `request_failed_${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
