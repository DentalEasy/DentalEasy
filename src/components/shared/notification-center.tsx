"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Settings,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, type NotificationType } from "@/contexts/notification-context";
import { Button } from "@/components/ui";

const ICON_CONFIG: Record<NotificationType, { icon: typeof Bell; bg: string; iconColor: string }> = {
  appointment: { icon: Calendar, bg: "bg-blue-50", iconColor: "text-blue-500" },
  payment: { icon: DollarSign, bg: "bg-emerald-50", iconColor: "text-emerald-500" },
  stock: { icon: Package, bg: "bg-amber-50", iconColor: "text-amber-500" },
  treatment: { icon: FileText, bg: "bg-violet-50", iconColor: "text-violet-500" },
  system: { icon: Settings, bg: "bg-neutral-100", iconColor: "text-neutral-500" },
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors cursor-pointer"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-danger-500 text-white text-[10px] font-bold px-1 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-white border border-neutral-200 rounded-xl shadow-xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">Notificações</h3>
              {unreadCount > 0 && (
                <span className="h-5 min-w-[20px] flex items-center justify-center rounded-full bg-danger-50 text-danger-600 text-[11px] font-semibold px-1">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = ICON_CONFIG[notification.type];
                const Icon = config.icon;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b border-neutral-50 transition-colors hover:bg-neutral-50 cursor-pointer",
                      !notification.read && "bg-primary-50/40"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                      <Icon className={cn("h-4 w-4", config.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !notification.read ? "font-semibold text-neutral-900" : "font-medium text-neutral-700"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-1">{notification.time}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="h-6 w-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-neutral-100">
              <p className="text-[11px] text-neutral-400 text-center">
                {notifications.length} notificação{notifications.length !== 1 ? "ões" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
