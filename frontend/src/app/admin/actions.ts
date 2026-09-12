"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  API_BASE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth-cookies";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return { error: "Неверный email или пароль" };
  }

  const { access_token, refresh_token } = await res.json();
  const store = await cookies();
  store.set(ACCESS_COOKIE, access_token, accessCookieOptions);
  store.set(REFRESH_COOKIE, refresh_token, refreshCookieOptions);

  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});
  }

  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);

  redirect("/admin/login");
}
