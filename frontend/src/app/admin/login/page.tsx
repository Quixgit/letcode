"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";
import { Card } from "@/components/admin/m3/Card";
import { TextField } from "@/components/admin/m3/TextField";
import { Button } from "@/components/admin/m3/Button";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="md-admin-root flex min-h-screen items-center justify-center bg-md-surface">
      <Card elevation={2} className="w-80 p-8">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-md-primary">
              <i className="ti ti-terminal-2 text-base text-md-on-primary" />
            </div>
            <span className="md-title-medium text-md-on-surface">lecode admin</span>
          </div>

          <TextField name="email" type="email" required autoComplete="email" label="Email" />
          <TextField name="password" type="password" required autoComplete="current-password" label="Пароль" />

          {state?.error && <p className="md-body-small m-0 text-md-error">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-1 w-full">
            {pending ? "Вход..." : "Войти"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
