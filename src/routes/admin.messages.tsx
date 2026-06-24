import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadAdminContext, type AdminContext, can, logAdmin } from "@/lib/admin";
import { Trash2, Flag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/messages")({
  component: MessagesAdmin,
});

function MessagesAdmin() {
  const [ctx, setCtx] = useState<AdminContext | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await supabase.from("case_messages").select("id, case_id, sender_id, body, created_at").order("created_at", { ascending: false }).limit(200);
    setRows(data ?? []);
  };
  useEffect(() => {
    loadAdminContext().then(setCtx);
    load();
    const ch = supabase.channel("admin-msgs").on("postgres_changes", { event: "*", schema: "public", table: "case_messages" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("case_messages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAdmin("messages", "delete", id, {});
    toast.success("Deleted");
  };

  const flag = async (id: string) => {
    const reason = window.prompt("Reason for flagging?");
    if (!reason) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await (supabase.from as any)("message_flags").insert({ message_id: id, reporter_id: u.user.id, reason });
    await logAdmin("messages", "flag", id, { reason });
    toast.success("Flagged for review");
  };

  const filtered = rows.filter((r) => !q || r.body.toLowerCase().includes(q.toLowerCase()));
  const canEdit = ctx && can(ctx, "messages", "edit");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl">Messages</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search content…" className="px-3 py-2 rounded-md bg-card border border-border text-sm" />
      </div>
      <div className="space-y-2">
        {filtered.map((m) => (
          <div key={m.id} className="rounded-lg border border-border bg-card/40 p-3 flex items-start gap-3">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground"><Link to="/cases/$caseId" params={{ caseId: m.case_id }} className="hover:text-gold">Case {m.case_id.slice(0, 8)}</Link> · {new Date(m.created_at).toLocaleString()}</div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{m.body}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => flag(m.id)} className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400" title="Flag"><Flag className="h-4 w-4" /></button>
              {canEdit && <button onClick={() => remove(m.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="Delete"><Trash2 className="h-4 w-4" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
