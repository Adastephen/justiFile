import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadAdminContext, type AdminContext, can, logAdmin } from "@/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/flags")({
  component: FlagsAdmin,
});

function FlagsAdmin() {
  const [ctx, setCtx] = useState<AdminContext | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState<"open" | "resolved" | "dismissed">("open");

  const load = async () => {
    const { data: flags } = await (supabase.from as any)("message_flags").select("*").eq("status", tab).order("created_at", { ascending: false }).limit(200);
    const ids = (flags ?? []).map((f: any) => f.message_id);
    let msgs: any[] = [];
    if (ids.length) {
      const { data } = await supabase.from("case_messages").select("id, body, case_id, sender_id, created_at").in("id", ids);
      msgs = data ?? [];
    }
    const merged = (flags ?? []).map((f: any) => ({ ...f, message: msgs.find((m) => m.id === f.message_id) }));
    setRows(merged);
  };
  useEffect(() => { loadAdminContext().then(setCtx); load(); }, [tab]);

  const resolve = async (id: string, status: "resolved" | "dismissed") => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase.from as any)("message_flags").update({ status, resolved_by: u.user?.id, resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAdmin("flags", status, id, {});
    toast.success(`Marked ${status}`);
    load();
  };

  const deleteMessage = async (mid: string) => {
    await supabase.from("case_messages").delete().eq("id", mid);
    await logAdmin("messages", "delete_via_flag", mid, {});
    toast.success("Message deleted");
    load();
  };

  const canEdit = ctx && can(ctx, "flags", "edit");

  return (
    <div>
      <h1 className="font-display text-3xl mb-4">Flagged messages</h1>
      <div className="flex gap-2 mb-4">
        {(["open", "resolved", "dismissed"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-sm rounded ${tab === t ? "bg-gold/20 text-gold" : "bg-card/40 text-muted-foreground"}`}>{t}</button>
        ))}
      </div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-muted-foreground text-sm">No {tab} flags.</p>}
        {rows.map((f) => (
          <div key={f.id} className="rounded-lg border border-border bg-card/40 p-4">
            <div className="text-xs text-muted-foreground">Reason: <span className="text-foreground">{f.reason}</span> · {new Date(f.created_at).toLocaleString()}</div>
            <p className="text-sm mt-2 whitespace-pre-wrap border-l-2 border-amber-500 pl-3">{f.message?.body ?? "(message deleted)"}</p>
            {canEdit && tab === "open" && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => resolve(f.id, "resolved")} className="px-3 py-1 text-xs rounded bg-emerald-500/20 text-emerald-400">Resolve</button>
                <button onClick={() => resolve(f.id, "dismissed")} className="px-3 py-1 text-xs rounded bg-muted text-muted-foreground">Dismiss</button>
                {f.message && <button onClick={() => deleteMessage(f.message.id)} className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-400">Delete message</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
