"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, ClinicProvider, ProceduresProvider, NotificationProvider, useAuth } from "@/contexts";
import { ToastProvider } from "@/components/ui/toast";
import { AppLayout } from "@/components/layout";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGate>
        <ClinicProvider>
          <ProceduresProvider>
            <NotificationProvider>
              <ToastProvider>
                <AppLayout>{children}</AppLayout>
              </ToastProvider>
            </NotificationProvider>
          </ProceduresProvider>
        </ClinicProvider>
      </AuthGate>
    </AuthProvider>
  );
}
