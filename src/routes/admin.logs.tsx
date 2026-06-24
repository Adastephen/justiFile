import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/logs")({
  component: LogsAdmin,
});

function LogsAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [module, setModule] = useState("");

  useEffect(() => {
    (async () => {
      let q = (supabase.from as any)("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
      if (module) q = q.eq("module", module);
      const { data } = await q;
      setRows(data ?? []);
    })();
  }, [module]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl">Audit logs</h1>
        <select value={module} onChange={(e) => setModule(e.target.value)} className="px-3 py-2 rounded-md bg-card border border-border text-sm">
          <option value="">All modules</option>
          {["users", "lawyers", "cases", "messages", "flags", "logs", "sql"].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card/60 text-left text-muted-foreground">
            <tr><th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Module</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Details</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3 text-xs">{r.actor_id?.slice(0, 8) ?? "—"}</td>
                <td className="p-3">{r.module}</td>
                <td className="p-3">{r.action}</td>
                <td className="p-3 text-xs">{r.target?.slice(0, 8) ?? "—"}</td>
                <td className="p-3 text-xs"><pre className="text-[10px] whitespace-pre-wrap max-w-md">{JSON.stringify(r.details, null, 2)}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
