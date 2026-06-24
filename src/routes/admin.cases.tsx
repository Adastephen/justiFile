import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadAdminContext, type AdminContext, can, logAdmin } from "@/lib/admin";

export const Route = createFileRoute("/admin/cases")({
  component: CasesAdmin,
});

function CasesAdmin() {
  const [ctx, setCtx] = useState<AdminContext | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    let q = supabase.from("cases").select("id, title, category, status, is_pro_bono, budget_ngn, created_at").order("created_at", { ascending: false }).limit(200);
    if (status) q = q.eq("status", status as any);
    const { data } = await q;
    setRows(data ?? []);
  };
  useEffect(() => { loadAdminContext().then(setCtx); load(); }, [status]);

  const setCaseStatus = async (id: string, s: string) => {
    await supabase.from("cases").update({ status: s as any }).eq("id", id);
    await logAdmin("cases", "set_status", id, { status: s });
    load();
  };

  const canEdit = ctx && can(ctx, "cases", "edit");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl">Cases</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-md bg-card border border-border text-sm">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card/60 text-left text-muted-foreground">
            <tr><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Pro bono</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3"><Link to="/cases/$caseId" params={{ caseId: c.id }} className="hover:text-gold">{c.title}</Link></td>
                <td className="p-3 text-muted-foreground">{c.category}</td>
                <td className="p-3">{c.status}</td>
                <td className="p-3">{c.is_pro_bono ? "Yes" : "—"}</td>
                <td className="p-3 text-right">
                  {canEdit && (
                    <select onChange={(e) => e.target.value && setCaseStatus(c.id, e.target.value)} value="" className="px-2 py-1 rounded bg-background border border-border text-xs">
                      <option value="">Change…</option>
                      <option value="open">open</option>
                      <option value="in_progress">in_progress</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
