import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, LogOut, Scale, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard · JustiFile" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; account_type: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(data.session.user.id);
      const { data: p } = await supabase.from("profiles").select("full_name, account_type").eq("id", data.session.user.id).maybeSingle();
      if (p) setProfile(p);
      const [{ data: r }, { data: ap }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.session.user.id),
        (supabase.from as any)("admin_permissions").select("id").eq("user_id", data.session.user.id).limit(1),
      ]);
      const hasRole = (r ?? []).some((x: any) => x.role === "admin" || x.role === "super_admin");
      setIsAdmin(hasRole || (ap ?? []).length > 0);
    });
  }, [navigate]);

  const { data: cases } = useQuery({
    queryKey: ["cases", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("cases")
        .select("id, title, category, status, is_pro_bono, created_at")
        .or(`client_id.eq.${userId},lawyer_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  const isLawyer = profile?.account_type === "lawyer";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-24 w-full">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-gold text-xs uppercase tracking-[0.2em]">Your chambers</p>
            <h1 className="font-display text-4xl mt-2">Welcome, {profile?.full_name ?? "Counsel"}</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {isLawyer ? "Lawyer dashboard" : "Client dashboard"} · {profile?.account_type?.replace("_", " ")}
            </p>
          </div>
          <div className="flex gap-3">
            {!isLawyer && (
              <Link to="/submit-case" className="btn-gold"><Plus className="h-4 w-4" /> New case</Link>
            )}
            {isLawyer && (
              <>
                <Link to="/cases" className="btn-gold"><FileText className="h-4 w-4" /> Open cases</Link>
                <Link to="/lawyers" className="btn-ghost-gold"><Scale className="h-4 w-4" /> Directory</Link>
              </>
            )}
            {isAdmin && <Link to="/admin" className="btn-ghost-gold"><Shield className="h-4 w-4" /> Admin</Link>}
            <button onClick={signOut} className="btn-ghost-gold"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </div>


        <div className="mt-12 grid md:grid-cols-3 gap-5">
          <Stat label="Active cases" value={String((cases ?? []).filter((c) => c.status !== "completed").length)} />
          <Stat label="Pro bono" value={String((cases ?? []).filter((c) => c.is_pro_bono).length)} />
          <Stat label="Completed" value={String((cases ?? []).filter((c) => c.status === "completed").length)} />
        </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl mb-4">Your cases</h2>
          {!cases || cases.length === 0 ? (
            <div className="rounded-xl border border-border bg-panel/60 p-10 text-center">
              <FileText className="h-8 w-8 text-gold mx-auto" />
              <p className="font-display text-xl mt-4">No cases yet</p>
              <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
                {isLawyer ? "Browse the pro bono pool or wait for a paying client to book you." : "Submit your first matter and we'll route it to a verified lawyer."}
              </p>
              {!isLawyer && <Link to="/submit-case" className="btn-gold mt-6 inline-flex"><Plus className="h-4 w-4" /> Submit a case</Link>}
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-panel/60 text-muted-foreground text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-4">Title</th>
                    <th className="text-left p-4">Area</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-border hover:bg-panel/40 cursor-pointer"
                      onClick={() => navigate({ to: "/cases/$caseId", params: { caseId: c.id } })}
                    >
                      <td className="p-4 font-medium">{c.title}</td>
                      <td className="p-4 text-muted-foreground">{c.category}</td>
                      <td className="p-4">
                        {c.is_pro_bono ? <span className="text-xs px-2 py-0.5 rounded-full bg-naija/15 text-naija">Pro bono</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-gold/15 text-gold">Paid</span>}
                      </td>
                      <td className="p-4 text-muted-foreground capitalize">{c.status.replace("_", " ")}</td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel/60 p-6">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-4xl mt-2">{value}</p>
    </div>
  );
}
