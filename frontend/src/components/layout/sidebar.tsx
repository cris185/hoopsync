"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Calendar, LayoutDashboard, LogOut, Trophy, Users } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABEL, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/matches", label: "Matches", icon: Calendar },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div className="flex w-62 min-w-62 flex-col gap-6 border-r border-surface-border bg-bg-elevated p-5">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
        <Logo size={22} />
        <span className="font-display text-base font-extrabold tracking-wide uppercase">HoopSync</span>
      </Link>

      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-sm py-2.5 pr-3.5 pl-4.5 text-sm font-medium transition",
                isActive ? "bg-accent/15 font-semibold text-accent-400" : "text-text-secondary hover:bg-white/5",
              )}
            >
              {isActive && (
                <span
                  className="absolute top-1.5 bottom-1.5 left-0 w-1 bg-accent"
                  style={{ clipPath: "polygon(100% 0, 100% 100%, 0 85%, 0 15%)" }}
                />
              )}
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-2.5 rounded-md border border-surface-border bg-surface-tint p-2.5">
        <div className="flex h-8.5 w-8.5 min-w-8.5 items-center justify-center rounded-full bg-accent font-display text-xs font-extrabold text-accent-ink">
          {getInitials(user.name)}
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <span className="truncate text-xs font-semibold">{user.name}</span>
          <span className="truncate text-[11px] text-text-tertiary">{ROLE_LABEL[user.role]}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className="cursor-pointer text-text-tertiary transition hover:text-status-live"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
