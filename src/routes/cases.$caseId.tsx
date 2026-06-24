import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string;
  case_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type CaseRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  jurisdiction: string | null;
  status: string;
  is_pro_bono: boolean;
  budget_ngn: number | null;
  client_id: string;
  lawyer_id: string | null;
  created_at: string;
};

export const Route = createFileRoute("/cases/$caseId")({
  head: () => ({ meta: [{ title: "Case · JustiFile" }] }),
  component: CaseView,
});

function CaseView() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"client" | "lawyer" | "admin" | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(data.session.user.id);
      const { data: r } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      const roles = (r ?? []).map((x) => x.role);
      if (roles.includes("admin")) setRole("admin");
      else if (roles.includes("lawyer")) setRole("lawyer");
      else setRole("client");
    });
  }, [navigate]);

  const { data: caseRow, isLoading: caseLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .maybeSingle();
      if (error) throw error;
      return data as CaseRow | null;
    },
    enabled: !!userId,
  });

  const isParticipant = useMemo(
    () => !!caseRow && !!userId && (caseRow.client_id === userId || caseRow.lawyer_id === userId),
    [caseRow, userId],
  );

  const { data: messages } = useQuery({
    queryKey: ["case-messages", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_messages")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!userId && isParticipant,
  });

  // Participant names (for labels)
  const { data: profiles } = useQuery({
    queryKey: ["case-profiles", caseRow?.client_id, caseRow?.lawyer_id],
    queryFn: async () => {
      const ids = [caseRow?.client_id, caseRow?.lawyer_id].filter(Boolean) as string[];
      if (ids.length === 0) return {} as Record<string, string>;
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, string> = {};
      (data ?? []).forEach((p) => (map[p.id] = p.full_name));
      return map;
    },
    enabled: !!caseRow,
  });

  // Realtime subscription
  useEffect(() => {
    if (!isParticipant) return;
    const channel = supabase
      .channel(`case-messages-${caseId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "case_messages", filter: `case_id=eq.${caseId}` },
        (payload) => {
          qc.setQueryData<Message[]>(["case-messages", caseId], (old = []) => {
            if (old.some((m) => m.id === (payload.new as Message).id)) return old;
            return [...old, payload.new as Message];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, isParticipant, qc]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages?.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !userId) return;
    setDraft("");
    const { error } = await supabase
      .from("case_messages")
      .insert({ case_id: caseId, sender_id: userId, body });
    if (error) {
      toast.error(error.message);
      setDraft(body);
    }
  }

  async function claimCase() {
    if (!userId) return;
    const { error } = await supabase
      .from("cases")
      .update({ lawyer_id: userId, status: "in_progress" })
      .eq("id", caseId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Case claimed");
    qc.invalidateQueries({ queryKey: ["case", caseId] });
  }

  async function markCompleted() {
    const { error } = await supabase.from("cases").update({ status: "completed" }).eq("id", caseId);
    if (error) return toast.error(error.message);
    toast.success("Case marked complete");
    qc.invalidateQueries({ queryKey: ["case", caseId] });
  }

  if (caseLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 grid place-items-center text-muted-foreground">Loading case…</div>
        <Footer />
      </div>
    );
  }

  if (!caseRow) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-2xl">Case not available</p>
            <p className="text-muted-foreground text-sm mt-2">It may be assigned to another lawyer or closed.</p>
            <Link to="/dashboard" className="btn-ghost-gold mt-6 inline-flex"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const canClaim = role === "lawyer" && !caseRow.lawyer_id && caseRow.status === "open";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16 w-full flex-1 grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Chat column */}
        <div className="flex flex-col rounded-xl border border-border bg-panel/40 overflow-hidden min-h-[70vh]">
          <header className="p-5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div>
              <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Dashboard
              </Link>
              <h1 className="font-display text-2xl mt-1">{caseRow.title}</h1>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {caseRow.category} · {caseRow.status.replace("_", " ")}
              </p>
            </div>
            <div className="flex gap-2">
              {caseRow.is_pro_bono ? (
                <span className="text-xs px-2 py-1 rounded-full bg-naija/15 text-naija">Pro bono</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gold/15 text-gold">Paid</span>
              )}
            </div>
          </header>

          {!isParticipant ? (
            <div className="flex-1 grid place-items-center p-10 text-center">
              {canClaim ? (
                <div>
                  <p className="font-display text-xl">Claim this matter to open the channel</p>
                  <p className="text-muted-foreground text-sm mt-2 max-w-md">Once claimed, you and the client get a private messaging thread.</p>
                  <button onClick={claimCase} className="btn-gold mt-6">Claim case</button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">You are not a participant in this matter.</p>
              )}
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
                {(messages ?? []).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center mt-10">
                    No messages yet. Say hello to your {userId === caseRow.client_id ? "lawyer" : "client"}.
                  </p>
                )}
                {(messages ?? []).map((m) => {
                  const mine = m.sender_id === userId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-gold text-[oklch(0.18_0.035_256)]" : "bg-panel border border-border"}`}>
                        {!mine && (
                          <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1">
                            {profiles?.[m.sender_id] ?? "Counsel"}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`text-[10px] mt-1 ${mine ? "text-[oklch(0.18_0.035_256)]/60" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  maxLength={4000}
                />
                <button type="submit" disabled={!draft.trim()} className="btn-gold disabled:opacity-50">
                  <Send className="h-4 w-4" /> Send
                </button>
              </form>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-panel/60 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Matter</p>
            <p className="text-sm mt-2 whitespace-pre-wrap">{caseRow.description}</p>
            <dl className="mt-4 space-y-2 text-xs">
              {caseRow.jurisdiction && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Jurisdiction</dt><dd>{caseRow.jurisdiction}</dd></div>
              )}
              {caseRow.budget_ngn && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Budget</dt><dd>₦{caseRow.budget_ngn.toLocaleString()}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">Filed</dt><dd className="font-mono">{new Date(caseRow.created_at).toLocaleDateString()}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-panel/60 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Parties</p>
            <div className="mt-3 space-y-2 text-sm">
              <div><span className="text-muted-foreground text-xs">Client: </span>{profiles?.[caseRow.client_id] ?? "—"}</div>
              <div><span className="text-muted-foreground text-xs">Lawyer: </span>{caseRow.lawyer_id ? profiles?.[caseRow.lawyer_id] ?? "Assigned" : "Unassigned"}</div>
            </div>
          </div>

          {isParticipant && caseRow.status !== "completed" && (
            <button onClick={markCompleted} className="w-full btn-ghost-gold justify-center">
              <CheckCircle2 className="h-4 w-4" /> Mark completed
            </button>
          )}
        </aside>
      </section>
      <Footer />
    </div>
  );
}
