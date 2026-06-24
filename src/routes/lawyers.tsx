import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, Star, Search, MapPin } from "lucide-react";
import { useState } from "react";

const CATEGORY_LABEL: Record<string, string> = {
  regular_advocate: "Regular Advocate",
  san: "Senior Advocate of Nigeria",
  retired_judge: "Retired Judge",
  notary_public: "Notary Public",
};

export const Route = createFileRoute("/lawyers")({
  head: () => ({
    meta: [
      { title: "Find a Lawyer · JustiFile" },
      { name: "description", content: "Browse verified Nigerian lawyers, SANs, retired judges and notary publics on JustiFile." },
    ],
  }),
  component: LawyersDirectory,
});

function LawyersDirectory() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["lawyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyer_profiles")
        .select("id, category, bio, specialties, years_experience, rating_avg, rating_count, verified, hourly_rate_ngn, profiles!inner(full_name, state, avatar_url)")
        .order("rating_avg", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const list = (data ?? []).filter((l: any) => {
    if (cat !== "all" && l.category !== cat) return false;
    if (q && !`${l.profiles?.full_name} ${(l.specialties ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-8 w-full">
        <p className="text-gold text-xs uppercase tracking-[0.2em]">Directory</p>
        <h1 className="font-display text-4xl md:text-5xl mt-3">Find a Lawyer</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl">
          Search verified Nigerian legal practitioners by specialty, category, and location. Every profile is NBA-credential checked.
        </p>

        <div className="mt-8 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or specialty" className="input-legal pl-10" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="input-legal md:w-72">
            <option value="all">All categories</option>
            <option value="regular_advocate">Regular Advocate</option>
            <option value="san">Senior Advocate (SAN)</option>
            <option value="retired_judge">Retired Judge</option>
            <option value="notary_public">Notary Public</option>
          </select>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 w-full">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading directory…</div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-border bg-panel/60 p-12 text-center">
            <h3 className="font-display text-2xl">No lawyers yet</h3>
            <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
              The directory is being populated as verified practitioners onboard. Sign up as a lawyer to be among the first.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((l: any) => (
              <article key={l.id} className="rounded-xl border border-border bg-panel/60 p-6 hover:border-gold/40 transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl">{l.profiles?.full_name ?? "Verified counsel"}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{CATEGORY_LABEL[l.category]}</p>
                  </div>
                  {l.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold/15 text-gold">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-gold" /> {Number(l.rating_avg).toFixed(1)} <span className="text-xs">({l.rating_count})</span></span>
                  <span>{l.years_experience} yrs</span>
                  {l.profiles?.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {l.profiles.state}</span>}
                </div>
                {l.bio && <p className="text-sm text-muted-foreground mt-4 line-clamp-3">{l.bio}</p>}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(l.specialties ?? []).slice(0, 4).map((s: string) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">{s}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
