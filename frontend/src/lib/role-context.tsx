"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "./admin-api";

export interface CurrentUser {
  email: string;
  name: string | null;
  role: "admin" | "editor" | "viewer" | string;
}

interface RoleContextValue {
  user: CurrentUser | undefined;
  isLoading: boolean;
  canEdit: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  user: undefined,
  isLoading: true,
  canEdit: false,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => adminFetch<CurrentUser>("auth/me"),
    staleTime: 5 * 60 * 1000,
  });

  const canEdit = data ? data.role !== "viewer" : false;

  return (
    <RoleContext.Provider value={{ user: data, isLoading, canEdit }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(RoleContext);
}

export function useCanEdit() {
  return useContext(RoleContext).canEdit;
}

export function useIsAdmin() {
  return useContext(RoleContext).user?.role === "admin";
}
