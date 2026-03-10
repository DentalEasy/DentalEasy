"use client";

import { Sidebar } from "./sidebar";
import { NotificationCenter } from "@/components/shared/notification-center";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="hidden lg:flex items-center justify-end gap-2 px-6 h-14 border-b border-border shrink-0 bg-white">
          <NotificationCenter />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 pt-14 lg:pt-6 max-w-[1280px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
