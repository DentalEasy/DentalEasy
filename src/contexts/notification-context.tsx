"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  deleteNotification as deleteNotificationApi,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api";
import type { AppNotification } from "@/types";

export type NotificationType =
  | "appointment"
  | "payment"
  | "stock"
  | "treatment"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const mapType = (type: AppNotification["type"]): NotificationType => {
  if (type === "APPOINTMENT") return "appointment";
  if (type === "PAYMENT") return "payment";
  if (type === "INVENTORY") return "stock";
  if (type === "TREATMENT") return "treatment";
  return "system";
};

const formatRelative = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Agora";
  if (diffMinutes < 60) return `${diffMinutes} min atrás`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? "s" : ""} atrás`;
  return date.toLocaleDateString("pt-BR");
};

const mapNotification = (notification: AppNotification): Notification => ({
  id: notification.id,
  type: mapType(notification.type),
  title: notification.title,
  description: notification.message,
  time: formatRelative(notification.createdAt),
  read: notification.read,
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await listNotifications();
      setNotifications(data.map((notification) => mapNotification(notification)));
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    try {
      await markNotificationAsRead(id);
    } catch {
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true }))
    );
    try {
      await markAllNotificationsAsRead();
    } catch {
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  const removeNotification = useCallback(async (id: string) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
    try {
      await deleteNotificationApi(id);
    } catch {
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
