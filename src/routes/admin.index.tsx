import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Briefcase, MessageSquare, Flag } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

function Stat({ label, value, icon: Icon }: any) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="mt-2 text-3xl font-display">{value ?? "—"}</div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    (async () => {
      const [u, l, c, m, f] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("lawyer_profiles").select("*", { count: "exact", head: true }),
        supabase.from("cases").select("*", { count: "exact", head: true }),
        supabase.from("case_messages").select("*", { count: "exact", head: true }),
        (supabase.from as any)("message_flags").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      setStats({ users: u.count, lawyers: l.count, cases: c.count, messages: m.count, openFlags: f.count });
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Users" value={stats.users} icon={Users} />
        <Stat label="Lawyers" value={stats.lawyers} icon={Users} />
        <Stat label="Cases" value={stats.cases} icon={Briefcase} />
        <Stat label="Messages" value={stats.messages} icon={MessageSquare} />
        <Stat label="Open flags" value={stats.openFlags} icon={Flag} />
      </div>
    </div>
  );
}
