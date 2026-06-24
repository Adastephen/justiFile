import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadAdminContext, type AdminContext, can, logAdmin } from "@/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const [ctx, setCtx] = useState<AdminContext | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, account_type, phone, created_at").order("created_at", { ascending: false }).limit(200);
    setRows(data ?? []);
    const { data: r } = await supabase.from("user_roles").select("user_id, role");
    const map: Record<string, string[]> = {};
    (r ?? []).forEach((x: any) => { (map[x.user_id] ||= []).push(x.role); });
    setRoles(map);
  };
  useEffect(() => { loadAdminContext().then(setCtx); load(); }, []);

  const toggleRole = async (userId: string, role: string, has: boolean) => {
    if (!ctx?.isSuperAdmin) { toast.error("Super admin only"); return; }
    if (has) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    }
    await logAdmin("users", has ? "revoke_role" : "grant_role", userId, { role });
    load();
  };

  const filtered = rows.filter((r) => !q || (r.full_name ?? "").toLowerCase().includes(q.toLowerCase()));
  const canEdit = ctx && can(ctx, "users", "edit");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl">Users</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name…" className="px-3 py-2 rounded-md bg-card border border-border text-sm" />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card/60 text-left text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Roles</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const ur = roles[u.id] ?? [];
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3">{u.full_name}</td>
                  <td className="p-3 text-muted-foreground">{u.account_type}</td>
                  <td className="p-3">{ur.join(", ") || "—"}</td>
                  <td className="p-3 text-right space-x-2">
                    {canEdit && ctx?.isSuperAdmin && ["client", "lawyer", "admin", "super_admin"].map((r) => (
                      <button key={r} onClick={() => toggleRole(u.id, r, ur.includes(r))} className={`px-2 py-1 text-xs rounded border ${ur.includes(r) ? "bg-gold/20 border-gold text-gold" : "border-border text-muted-foreground hover:text-foreground"}`}>{r}</button>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!ctx?.isSuperAdmin && <p className="mt-3 text-xs text-muted-foreground">Only super admins can grant or revoke roles.</p>}
    </div>
  );
}
