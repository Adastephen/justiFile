import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadAdminContext, type AdminContext, can, logAdmin } from "@/lib/admin";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/lawyers")({
  component: LawyersAdmin,
});

function LawyersAdmin() {
  const [ctx, setCtx] = useState<AdminContext | null>(null);
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("lawyer_profiles").select("id, category, verified, rating_avg, rating_count, bar_number, jurisdictions, bio").order("verified", { ascending: true }).limit(200);
    setRows(data ?? []);
  };
  useEffect(() => { loadAdminContext().then(setCtx); load(); }, []);

  const setVerified = async (id: string, value: boolean) => {
    const { error } = await supabase.from("lawyer_profiles").update({ verified: value }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAdmin("lawyers", value ? "verify" : "unverify", id, {});
    toast.success(value ? "Verified" : "Unverified");
    load();
  };

  const canEdit = ctx && can(ctx, "lawyers", "edit");

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Lawyers</h1>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-card/40 p-4 flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.category}</span>
                {r.verified ? <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">VERIFIED</span> : <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">PENDING</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Bar #{r.bar_number ?? "—"} · {(r.jurisdictions ?? []).join(", ")}</div>
              <p className="text-sm mt-2 line-clamp-2">{r.bio ?? "No bio"}</p>
              <div className="text-xs text-muted-foreground mt-1">Rating {r.rating_avg ?? 0} ({r.rating_count ?? 0})</div>
            </div>
            {canEdit && (
              <div className="flex flex-col gap-2">
                <button onClick={() => setVerified(r.id, true)} disabled={r.verified} className="px-3 py-1.5 text-xs rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verify</button>
                <button onClick={() => setVerified(r.id, false)} disabled={!r.verified} className="px-3 py-1.5 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-40 inline-flex items-center gap-1"><XCircle className="h-3 w-3" /> Unverify</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
