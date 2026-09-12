"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/lib/toast";
import { RoleProvider } from "@/lib/role-context";
import { AdminThemeProvider } from "@/lib/admin-theme";
import { Sidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <AdminThemeProvider>
          <ToastProvider>
            <div className="md-admin-root flex h-screen overflow-hidden">
              <Sidebar />
              <main className="min-w-0 flex-1 overflow-y-auto bg-md-surface px-8 py-7">
                <AdminHeader />
                <div key={pathname} style={{ animation: "md-page-in var(--md-duration-medium) var(--md-easing-standard)" }}>
                  {children}
                </div>
              </main>
            </div>
          </ToastProvider>
        </AdminThemeProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}
