import { supabase } from "@/integrations/supabase/client";

export type AdminModule = "users" | "lawyers" | "cases" | "messages" | "flags" | "logs" | "sql";
export type AdminLevel = "view" | "edit";

export interface AdminContext {
  userId: string | null;
  isSuperAdmin: boolean;
  perms: Record<AdminModule, AdminLevel | null>;
}

export const ALL_MODULES: AdminModule[] = ["users", "lawyers", "cases", "messages", "flags", "logs", "sql"];

export async function loadAdminContext(): Promise<AdminContext> {
  const { data: u } = await supabase.auth.getUser();
  const userId = u.user?.id ?? null;
  const empty: Record<AdminModule, AdminLevel | null> = {
    users: null, lawyers: null, cases: null, messages: null, flags: null, logs: null, sql: null,
  };
  if (!userId) return { userId: null, isSuperAdmin: false, perms: empty };

  const [{ data: roles }, { data: perms }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    (supabase.from as any)("admin_permissions").select("module, level").eq("user_id", userId),
  ]);

  const isSuperAdmin = (roles ?? []).some((r: any) => r.role === "super_admin");
  const map = { ...empty };
  (perms ?? []).forEach((p: any) => {
    map[p.module as AdminModule] = p.level as AdminLevel;
  });
  return { userId, isSuperAdmin, perms: map };
}

export function can(ctx: AdminContext, mod: AdminModule, lvl: AdminLevel): boolean {
  if (ctx.isSuperAdmin) return true;
  const p = ctx.perms[mod];
  if (!p) return false;
  if (lvl === "view") return true;
  return p === "edit";
}

export async function logAdmin(module: AdminModule, action: string, target: string | null, details: any) {
  await (supabase.rpc as any)("log_admin_action", { _module: module, _action: action, _target: target, _details: details });
}
