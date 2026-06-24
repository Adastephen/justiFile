import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadAdminContext, type AdminContext, ALL_MODULES, can } from "@/lib/admin";
import { Navbar } from "@/components/site/Navbar";
import { Shield, Users, Scale, Briefcase, MessageSquare, Flag, FileClock, Terminal, KeyRound, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV: { to: string; label: string; icon: any; mod?: any }[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users, mod: "users" },
  { to: "/admin/lawyers", label: "Lawyers", icon: Scale, mod: "lawyers" },
  { to: "/admin/cases", label: "Cases", icon: Briefcase, mod: "cases" },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare, mod: "messages" },
  { to: "/admin/flags", label: "Flags", icon: Flag, mod: "flags" },
  { to: "/admin/logs", label: "Audit logs", icon: FileClock, mod: "logs" },
  { to: "/admin/sql", label: "SQL runner", icon: Terminal, mod: "sql" },
  { to: "/admin/permissions", label: "Permissions", icon: KeyRound },
];

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [ctx, setCtx] = useState<AdminContext | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    loadAdminContext().then((c) => {
      if (!c.userId) { navigate({ to: "/auth" }); return; }
      const anyAccess = c.isSuperAdmin || Object.values(c.perms).some((p) => p !== null);
      if (!anyAccess) { setDenied(true); return; }
      setCtx(c);
    });
  }, [navigate]);

  if (denied) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl">Admin access required</h1>
          <p className="mt-2 text-muted-foreground">Your account doesn't have admin permissions. Ask a super admin to grant access.</p>
        </div>
      </div>
    );
  }
  if (!ctx) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <div className="rounded-lg border border-border bg-card/40 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-gold" />
              <span className="font-display text-lg">Admin</span>
              {ctx.isSuperAdmin && <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-gold/20 text-gold">SUPER</span>}
            </div>
            <nav className="space-y-1">
              {NAV.map((n) => {
                const allowed = !n.mod || can(ctx, n.mod, "view") || (n.to === "/admin/permissions" && ctx.isSuperAdmin) || n.to === "/admin";
                if (n.mod && !can(ctx, n.mod, "view")) return null;
                if (n.to === "/admin/permissions" && !ctx.isSuperAdmin) return null;
                const active = path === n.to;
                const Icon = n.icon;
                return (
                  <Link key={n.to} to={n.to as any} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${active ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="col-span-12 md:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
