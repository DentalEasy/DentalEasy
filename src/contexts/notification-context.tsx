"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ===========================
// Notification Center Context
// ===========================

export type NotificationType = "appointment" | "payment" | "stock" | "treatment" | "system";

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
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ─── Mock notifications ───
const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "appointment",
    title: "Consulta em 30 minutos",
    description: "Maria Silva — Limpeza Profilática às 09:00",
    time: "Agora",
    read: false,
  },
  {
    id: "n2",
    type: "payment",
    title: "Pagamento vencido",
    description: "Ana Costa — Coroa Cerâmica (R$ 2.800,00) venceu em 01/02",
    time: "2h atrás",
    read: false,
  },
  {
    id: "n3",
    type: "stock",
    title: "Estoque baixo",
    description: "Luvas de Procedimento — apenas 3 unidades restantes",
    time: "3h atrás",
    read: false,
  },
  {
    id: "n4",
    type: "treatment",
    title: "Plano de tratamento pendente",
    description: "João Oliveira — Tratamento Endodôntico aguardando aprovação",
    time: "5h atrás",
    read: false,
  },
  {
    id: "n5",
    type: "appointment",
    title: "Consulta confirmada",
    description: "Carlos Ferreira confirmou consulta para 15/03 às 15:00",
    time: "1 dia atrás",
    read: true,
  },
  {
    id: "n6",
    type: "system",
    title: "Backup realizado",
    description: "Backup automático dos dados concluído com sucesso",
    time: "1 dia atrás",
    read: true,
  },
  {
    id: "n7",
    type: "payment",
    title: "Pagamento recebido",
    description: "Maria Silva — PIX de R$ 250,00 confirmado",
    time: "2 dias atrás",
    read: true,
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
