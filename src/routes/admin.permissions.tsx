import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadAdminContext, type AdminContext, ALL_MODULES, type AdminModule, type AdminLevel, logAdmin } from "@/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/permissions")({
  component: PermsAdmin,
});

function PermsAdmin() {
  const [ctx, setCtx] = useState<AdminContext | null>(null);
  const [perms, setPerms] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [newUserId, setNewUserId] = useState("");
  const [newModule, setNewModule] = useState<AdminModule>("users");
  const [newLevel, setNewLevel] = useState<AdminLevel>("view");

  const load = async () => {
    const { data } = await (supabase.from as any)("admin_permissions").select("*").order("created_at", { ascending: false });
    setPerms(data ?? []);
    const ids = Array.from(new Set((data ?? []).map((p: any) => p.user_id))) as string[];
    if (ids.length) {
      const { data: pr } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, string> = {};
      (pr ?? []).forEach((p: any) => { map[p.id] = p.full_name; });
      setProfiles(map);
    }
  };
  useEffect(() => { loadAdminContext().then(setCtx); load(); }, []);

  if (ctx && !ctx.isSuperAdmin) {
    return <p className="text-muted-foreground">Super admin only.</p>;
  }

  const grant = async () => {
    if (!newUserId) { toast.error("Enter a user id"); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase.from as any)("admin_permissions").upsert({ user_id: newUserId.trim(), module: newModule, level: newLevel, granted_by: u.user?.id }, { onConflict: "user_id,module" });
    if (error) { toast.error(error.message); return; }
    await logAdmin("users", "grant_permission", newUserId, { module: newModule, level: newLevel });
    toast.success("Granted");
    setNewUserId("");
    load();
  };

  const revoke = async (id: string, target: string, module: string) => {
    await (supabase.from as any)("admin_permissions").delete().eq("id", id);
    await logAdmin("users", "revoke_permission", target, { module });
    load();
  };

  return (
    <div>
      <h1 className="font-display text-3xl mb-4">Admin permissions</h1>
      <div className="rounded-lg border border-border bg-card/40 p-4 mb-6">
        <h2 className="font-medium mb-3">Grant access</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={newUserId} onChange={(e) => setNewUserId(e.target.value)} placeholder="User ID (uuid)" className="px-3 py-2 rounded bg-background border border-border text-sm md:col-span-2" />
          <select value={newModule} onChange={(e) => setNewModule(e.target.value as AdminModule)} className="px-3 py-2 rounded bg-background border border-border text-sm">
            {ALL_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={newLevel} onChange={(e) => setNewLevel(e.target.value as AdminLevel)} className="px-3 py-2 rounded bg-background border border-border text-sm">
            <option value="view">view</option>
            <option value="edit">edit</option>
          </select>
        </div>
        <button onClick={grant} className="btn-gold mt-3">Grant</button>
        <p className="text-xs text-muted-foreground mt-2">Tip: find user IDs in the Users page or via SQL runner. Super admin role is granted via Users → role buttons.</p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card/60 text-left text-muted-foreground">
            <tr><th className="p-3">User</th><th className="p-3">Module</th><th className="p-3">Level</th><th className="p-3">Granted</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {perms.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">{profiles[p.user_id] ?? p.user_id.slice(0, 8)}</td>
                <td className="p-3">{p.module}</td>
                <td className="p-3">{p.level}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right"><button onClick={() => revoke(p.id, p.user_id, p.module)} className="text-xs text-red-400 hover:underline">Revoke</button></td>
              </tr>
            ))}
            {perms.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground text-sm">No grants yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
