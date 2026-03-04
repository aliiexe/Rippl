"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { SignedIn, SignedOut, RedirectToSignIn, UserButton, useUser } from "@clerk/nextjs";
import { TopbarProvider, useTopbar } from "@/components/layout/topbar-context";
import { RippleLogo } from "@/components/ripple-logo";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Mail,
  Calendar,
  Clock,
  Settings,
  ChevronDown,
  Menu,
} from "lucide-react";

const workspaceNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const communicationNav = [
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/compose", label: "Compose", icon: Mail },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/reminders", label: "Reminders", icon: Clock },
];

const accountNav = [{ href: "/settings", label: "Settings", icon: Settings }];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/groups": "Groups",
  "/compose": "Compose",
  "/events": "Events",
  "/reminders": "Reminders",
  "/settings": "Settings",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        <TopbarProvider>
          <Shell>{children}</Shell>
        </TopbarProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

const CRON_POLL_INTERVAL_MS = 15_000; // 15s when running locally (Vercel Cron only runs in production)

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { action } = useTopbar();
  const { user } = useUser();

  // When running on localhost, Vercel Cron doesn't run — trigger the same cron from the client so scheduled emails send
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.");
    if (!isLocal) return;
    const tick = () => fetch("/api/cron/reminders").catch(() => {});
    tick();
    const id = setInterval(tick, CRON_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const pageTitle = useMemo(() => {
    const base =
      workspaceNav.find((item) => pathname.startsWith(item.href))?.label ??
      communicationNav.find((item) => pathname.startsWith(item.href))?.label ??
      accountNav.find((item) => pathname.startsWith(item.href))?.label ??
      "Rippl";
    return pageTitles[pathname] ?? base;
  }, [pathname]);

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <div className="flex h-screen bg-[#0e0e0e] text-[#f2f2f2] overflow-hidden">
      {/* Mobile: backdrop to close menu when tapping outside */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r border-[rgba(255,255,255,0.06)] bg-[#0e0e0e] flex flex-col overflow-hidden transition-[width,transform] duration-300 ease-in-out md:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${sidebarCollapsed ? "w-[80px]" : "w-[240px]"}`}
      >
        <div className={sidebarCollapsed ? "px-0 pt-5 pb-2 flex flex-col items-center gap-3" : "p-5"}>
          <div className={`flex items-center gap-2.5 ${sidebarCollapsed ? "flex-col w-full" : "justify-between w-full"}`}>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2.5 flex-shrink-0 ${sidebarCollapsed ? "flex-col w-full items-center" : ""}`}
            >
              <div
                className={`rounded-xl bg-[#ff4000] flex items-center justify-center text-white flex-shrink-0 transition-[width,height] duration-300 ease-in-out ${
                  sidebarCollapsed ? "w-11 h-11" : "w-8 h-8"
                }`}
              >
                <RippleLogo className={`transition-[width,height] duration-300 ease-in-out ${sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"}`} />
              </div>
              {!sidebarCollapsed && (
                <span className="text-[15px] font-semibold text-[#f2f2f2]">Rippl</span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#161616] text-[#888] hover:text-[#f2f2f2] hover:bg-[#1e1e1e] transition-colors flex-shrink-0"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-150 ${
                  sidebarCollapsed ? "-rotate-90" : "rotate-90"
                }`}
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>

        {/* <div className="px-[20px] mt-4">
          <button
            type="button"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-[10px] bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] cursor-pointer hover:bg-[#262626] transition-all duration-150 ease-out"
          >
            <div className="w-6 h-6 rounded-[6px] bg-[#262626] flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-[#f2f2f2]">
              {(user?.firstName ?? "U").charAt(0)}
            </div>
            <span className="text-[13px] font-medium text-[#f2f2f2] flex-1 text-left truncate">
              {user?.firstName ?? "Workspace"}
            </span>
            <ChevronDown className="w-[13px] h-[13px] text-[#888] flex-shrink-0" strokeWidth={1.5} />
          </button>
        </div> */}

        <nav className={`flex-1 pt-4 pb-20 ${sidebarCollapsed ? "px-2 flex flex-col items-center gap-2" : "px-0 mt-2 space-y-5"}`}>
          {!sidebarCollapsed && (
            <div className="px-3 mb-2">
              <span className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-widest">
                Workspace
              </span>
            </div>
          )}
          <ul className={sidebarCollapsed ? "flex flex-col items-center gap-2 w-full" : "space-y-1.5"}>
            {workspaceNav.map((item) => (
              <li key={item.href} className={sidebarCollapsed ? "w-full flex justify-center" : ""}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  icon={<item.icon className={sidebarCollapsed ? "w-5 h-5" : "w-[18px] h-[18px]"} strokeWidth={1.5} />}
                  active={isActive(item.href)}
                  onClick={() => setSidebarOpen(false)}
                  collapsed={sidebarCollapsed}
                />
              </li>
            ))}
          </ul>

          {!sidebarCollapsed && (
            <div className="px-3 mb-2 mt-6">
              <span className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-widest">
                Communication
              </span>
            </div>
          )}
          <ul className={sidebarCollapsed ? "flex flex-col items-center gap-2 w-full mt-2" : "space-y-1.5 mt-0"}>
            {communicationNav.map((item) => (
              <li key={item.href} className={sidebarCollapsed ? "w-full flex justify-center" : ""}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  icon={<item.icon className={sidebarCollapsed ? "w-5 h-5" : "w-[18px] h-[18px]"} strokeWidth={1.5} />}
                  active={isActive(item.href)}
                  onClick={() => setSidebarOpen(false)}
                  badge={item.href === "/reminders" ? <ReminderCount /> : undefined}
                  collapsed={sidebarCollapsed}
                />
              </li>
            ))}
          </ul>

          {!sidebarCollapsed && (
            <div className="px-3 mb-2 mt-6">
              <span className="text-[11px] font-medium text-[#4a4a4a] uppercase tracking-widest">
                Account
              </span>
            </div>
          )}
          <ul className={sidebarCollapsed ? "flex flex-col items-center gap-2 w-full mt-2" : "space-y-1.5 mt-0"}>
            {accountNav.map((item) => (
              <li key={item.href} className={sidebarCollapsed ? "w-full flex justify-center" : ""}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  icon={<item.icon className={sidebarCollapsed ? "w-5 h-5" : "w-[18px] h-[18px]"} strokeWidth={1.5} />}
                  active={isActive(item.href)}
                  onClick={() => setSidebarOpen(false)}
                  collapsed={sidebarCollapsed}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2.5 ${sidebarCollapsed ? "justify-center py-4" : "p-4 pt-4"}`}>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          {!sidebarCollapsed && (
            <span className="text-[11px] text-[#4a4a4a] truncate flex-1 min-w-0">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </span>
          )}
        </div>
      </aside>

      <button
        type="button"
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#161616] text-[#f2f2f2] md:hidden transition-all duration-150 ease-out"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Menu"
      >
        <Menu className="w-[15px] h-[15px]" strokeWidth={1.5} />
      </button>

      <div className="flex-1 flex flex-col min-h-0 min-w-0 md:pl-0 overflow-hidden transition-[margin,padding] duration-300 ease-in-out">
        <header className="h-[52px] flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-7 border-b border-[rgba(255,255,255,0.06)] bg-[#0e0e0e]">
          <h1 className="text-[14px] sm:text-[15px] font-semibold text-[#f2f2f2] truncate min-w-0">{pageTitle}</h1>
          <div className="flex-shrink-0">
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className="bg-[#ff4000] hover:bg-[#e63900] text-white text-[12px] sm:text-[13px] font-semibold px-3 sm:px-4 py-1.5 rounded-lg transition-colors duration-150"
              >
                {action.label}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
  onClick,
  badge,
  collapsed = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <Link
        href={href}
        onClick={onClick}
        title={label}
        className={`flex items-center justify-center w-11 h-11 rounded-xl text-[13px] font-medium cursor-pointer transition-colors duration-200 ease-out flex-shrink-0 ${
          active
            ? "text-[#f2f2f2] bg-[#1e1e1e] ring-1 ring-[rgba(255,64,0,0.3)]"
            : "text-[#888] hover:text-[#f2f2f2] hover:bg-[#1e1e1e]"
        }`}
      >
        {icon}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-150 ease-out mx-2 ${
        active
          ? "text-[#f2f2f2] bg-[#1e1e1e]"
          : "text-[#888] hover:text-[#f2f2f2] hover:bg-[#1e1e1e]"
      }`}
    >
      {active && (
        <div
          className="absolute right-0 top-0 bottom-0 w-16 rounded-xl pointer-events-none"
          style={{ background: "linear-gradient(to left, rgba(255,64,0,0.25), transparent)" }}
        />
      )}
      {icon}
      <span className="flex-1 text-left truncate">{label}</span>
      {badge}
    </Link>
  );
}

import { REMINDERS_UPDATED_EVENT } from "@/lib/reminders-events";

function ReminderCount() {
  const [count, setCount] = useState(0);

  const fetchCount = () => {
    fetch("/api/reminders/count")
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d: { count?: number }) => setCount(d.count ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 25_000);
    const onRefresh = () => fetchCount();
    window.addEventListener(REMINDERS_UPDATED_EVENT, onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener(REMINDERS_UPDATED_EVENT, onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, []);

  if (count === 0) return null;
  return (
    <span className="ml-auto text-[10px] font-semibold bg-[#ff4000] text-white px-1.5 py-0.5 rounded-full">
      {count}
    </span>
  );
}
