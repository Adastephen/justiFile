import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Briefcase, Scale } from "lucide-react";

export const Route = createFileRoute("/cases/")({
  head: () => ({ meta: [{ title: "Open cases · JustiFile" }] }),
  component: OpenCases,
});

function OpenCases() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(data.session.user.id);
    });
  }, [navigate]);

  const { data: cases, isLoading } = useQuery({
    queryKey: ["open-cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, title, category, jurisdiction, is_pro_bono, budget_ngn, description, created_at")
        .is("lawyer_id", null)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-24 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-gold text-xs uppercase tracking-[0.2em]">Case pool</p>
            <h1 className="font-display text-4xl mt-2">Open matters awaiting counsel</h1>
            <p className="text-muted-foreground mt-2 text-sm">Claim a case to open a private channel with the client.</p>
          </div>
          <Link to="/dashboard" className="btn-ghost-gold"><Scale className="h-4 w-4" /> Dashboard</Link>
        </div>

        <div className="mt-10 grid gap-4">
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!isLoading && (!cases || cases.length === 0) && (
            <div className="rounded-xl border border-border bg-panel/60 p-10 text-center">
              <Briefcase className="h-8 w-8 text-gold mx-auto" />
              <p className="font-display text-xl mt-4">No open cases right now</p>
              <p className="text-muted-foreground text-sm mt-2">Check back shortly. Pro bono and paid matters surface here as clients submit them.</p>
            </div>
          )}
          {cases?.map((c) => (
            <Link
              key={c.id}
              to="/cases/$caseId"
              params={{ caseId: c.id }}
              className="rounded-xl border border-border bg-panel/60 p-6 hover:border-gold/60 transition block"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-display text-xl">{c.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {c.category}{c.jurisdiction ? ` · ${c.jurisdiction}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {c.is_pro_bono ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-naija/15 text-naija">Pro bono</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-gold/15 text-gold">
                      {c.budget_ngn ? `₦${c.budget_ngn.toLocaleString()}` : "Paid"}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground/80 mt-3 line-clamp-2">{c.description}</p>
              <p className="text-xs text-muted-foreground mt-3 font-mono">
                Filed {new Date(c.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
