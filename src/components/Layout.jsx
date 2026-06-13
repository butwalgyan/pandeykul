import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, ShieldCheck, Clock, Activity, UserPlus } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { authService } from "@/services";
import { navItems } from "@/routes/config";
import { PendingCountProvider, usePendingCount } from "@/context/PendingCountContext";

function LayoutContent({ isAdmin }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pendingCount } = usePendingCount();

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="block">
            <h1 className="font-heading text-2xl font-bold text-sidebar-primary tracking-tight">पाण्डे वंशावली</h1>
            <p className="text-xs text-sidebar-foreground/60 mt-1 tracking-widest uppercase">Family Heritage</p>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span>{item.label}</span>
                  {item.np && <span className="text-[10px] opacity-60 font-normal">{item.np}</span>}
                </span>
              </Link>
            );
          })}
        </nav>
        {isAdmin && (
          <div className="p-3 border-t border-sidebar-border space-y-0.5">
            <Link
              to="/admin/approvals"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${location.pathname === "/admin/approvals" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Approvals
              {pendingCount > 0 && (
                <span className="ml-auto bg-yellow-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{pendingCount}</span>
              )}
            </Link>
            <Link
              to="/admin/pending-approvals"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${location.pathname === "/admin/pending-approvals" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
            >
              <Clock className="w-4 h-4" />
              Pending Approvals
              {pendingCount > 0 && (
                <span className="ml-auto bg-yellow-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{pendingCount}</span>
              )}
            </Link>
            <Link
              to="/admin/access-requests"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${location.pathname === "/admin/access-requests" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
            >
              <UserPlus className="w-4 h-4" />
              Access Requests
            </Link>
            <Link
              to="/admin/access-logs"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${location.pathname === "/admin/access-logs" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
            >
              <Activity className="w-4 h-4" />
              Access Logs
            </Link>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden font-heading font-semibold text-primary">पाण्डे वंशावली</div>
          <div className="flex-1 hidden lg:block" />
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <footer className="border-t border-border bg-card/50 px-4 py-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} पाण्डे वंशावली. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default function Layout() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    authService.me().catch(() => null).then(u => {
      setIsAdmin(u?.role === "admin");
    });
  }, []);

  return (
    <PendingCountProvider enabled={isAdmin}>
      <LayoutContent isAdmin={isAdmin} />
    </PendingCountProvider>
  );
}
