"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  DollarSign,
  FileText,
  ClipboardList,
  Settings,
  ChevronLeft,
  LogOut,
  Stethoscope,
  Menu,
  X,
  ClipboardCheck,
  BarChart3,
  Package,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useClinic } from "@/contexts/clinic-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { Role } from "@/types";

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  allowedRoles?: Role[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Geral",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Atendimento",
    items: [
      { title: "Pacientes", href: "/patients", icon: Users },
      { title: "Agenda", href: "/appointments", icon: CalendarDays },
      { title: "Planos", href: "/treatment-plans", icon: ClipboardCheck },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Financeiro", href: "/financial", icon: DollarSign },
      { title: "Pagamentos", href: "/payments", icon: Receipt },
    ],
  },
  {
    label: "Clínico",
    items: [
      { title: "Prontuário", href: "/clinical-records", icon: ClipboardList, allowedRoles: ["DENTIST", "ADMIN"] },
      { title: "Receituário", href: "/prescriptions", icon: FileText, allowedRoles: ["DENTIST", "ADMIN"] },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Relatórios", href: "/reports", icon: BarChart3, allowedRoles: ["ADMIN", "DENTIST"] },
      { title: "Estoque", href: "/inventory", icon: Package, allowedRoles: ["ADMIN"] },
      { title: "Configurações", href: "/settings", icon: Settings, allowedRoles: ["ADMIN"] },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasRole, logout } = useAuth();
  const { organization } = useClinic();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const filterNav = (items: NavItem[]) =>
    items.filter((item) => !item.allowedRoles || hasRole(item.allowedRoles));

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const roleLabels: Record<Role, string> = {
    ADMIN: "Administrador",
    SECRETARY: "Secretária",
    DENTIST: "Dentista",
  };

  function NavLink({ item }: { item: NavItem }) {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
    const Icon = item.icon;

    const link = (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
          isActive
            ? "bg-neutral-100 text-neutral-900"
            : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-neutral-900" : "text-neutral-400")} />
        {!collapsed && <span>{item.title}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.title}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{link}</div>;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white shrink-0">
          <Stethoscope className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-neutral-900 truncate">
            {organization?.name ?? "DentalSaaS"}
          </span>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => {
          const visibleItems = filterNav(group.items);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 pb-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              {collapsed && group.label !== "Geral" && <Separator className="mb-2" />}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <Separator />

      {/* User */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
            <AvatarFallback className="text-xs bg-neutral-100 text-neutral-600">
              {user ? getInitials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-medium text-neutral-900 truncate">
                {user?.name}
              </span>
              <span className="text-[11px] text-neutral-400 truncate">
                {user ? roleLabels[user.role] : ""}
              </span>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              className="shrink-0 text-neutral-400 hover:text-danger-500"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-neutral-200 shadow-lg transform transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen bg-white border-r border-neutral-200 transition-all duration-200 sticky top-0 shrink-0",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarContent />

        {/* Collapse Toggle */}
        <div className="px-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-neutral-400"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span className="ml-1.5 text-xs">Recolher</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
