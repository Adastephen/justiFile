import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";

export const Route = createFileRoute("/submit-case")({
  head: () => ({
    meta: [
      { title: "Submit a Case · JustiFile" },
      { name: "description", content: "Describe your legal matter. Paid representation or pro bono — JustiFile routes your case to a verified lawyer." },
    ],
  }),
  component: SubmitCase,
});

function SubmitCase() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [proBono, setProBono] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return navigate({ to: "/auth", search: { tab: "signup" } });
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.from("cases").insert({
      client_id: sess.session.user.id,
      title: String(fd.get("title")),
      description: String(fd.get("description")),
      category: String(fd.get("category")),
      jurisdiction: String(fd.get("jurisdiction")),
      is_pro_bono: proBono,
      budget_ngn: proBono ? null : Number(fd.get("budget") || 0) || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(proBono ? "Case added to pro bono pool" : "Case submitted — browse lawyers next");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 w-full">
        <p className="text-gold text-xs uppercase tracking-[0.2em]">Case intake</p>
        <h1 className="font-display text-4xl md:text-5xl mt-3">Tell us about your matter</h1>
        <p className="text-muted-foreground mt-4">
          Provide enough detail for a lawyer to assess. Sensitive information is encrypted and only visible to verified counsel and JustiFile compliance reviewers.
        </p>

        {authed === false && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm">
            You'll be asked to sign in or create an account when you submit.{" "}
            <Link to="/auth" search={{ tab: "signup" }} className="text-gold underline">Create one now</Link>.
          </div>
        )}

        <form onSubmit={submit} className="mt-10 space-y-6 rounded-2xl border border-border bg-panel/60 p-8 md:p-10">
          <Field label="Case title">
            <input name="title" required maxLength={120} className="input-legal" placeholder="e.g. Tenancy dispute in Ikeja" />
          </Field>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Practice area">
              <select name="category" required className="input-legal">
                <option value="">Select an area</option>
                <option>Criminal Defence</option>
                <option>Civil Litigation</option>
                <option>Family Law</option>
                <option>Property & Tenancy</option>
                <option>Corporate / CAC</option>
                <option>Labour & Employment</option>
                <option>Human Rights</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Jurisdiction">
              <select name="jurisdiction" required className="input-legal">
                <option value="">Select region</option>
                <option value="south_penal">Southern Nigeria · Penal Code</option>
                <option value="north_criminal">Northern Nigeria · Criminal Code</option>
                <option value="federal">Federal / Cross-jurisdiction</option>
              </select>
            </Field>
          </div>

          <Field label="Describe what happened">
            <textarea name="description" required rows={6} minLength={30} className="input-legal" style={{ height: "auto", padding: "12px 14px" }} placeholder="Provide the facts, parties involved, and the outcome you're seeking." />
          </Field>

          <div className="rounded-lg border border-border p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={proBono} onChange={(e) => setProBono(e.target.checked)} className="mt-1 accent-[oklch(0.745_0.115_86)] h-4 w-4" />
              <span>
                <span className="font-medium">I cannot afford legal fees — request pro bono representation</span>
                <span className="block text-xs text-muted-foreground mt-1">
                  Your case will enter the pro bono pool where verified lawyers can claim it. Prison cases and low-income matters are prioritised.
                </span>
              </span>
            </label>
          </div>

          {!proBono && (
            <Field label="Indicative budget (₦)" hint="Optional — helps lawyers assess fit. Final fee is agreed in-app and held in escrow.">
              <input name="budget" type="number" min={0} className="input-legal" placeholder="250000" />
            </Field>
          )}

          <button type="submit" disabled={loading} className="btn-gold w-full mt-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Submit case
          </button>
        </form>
      </section>
      <Footer />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}
