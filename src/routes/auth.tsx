import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Scale, ShieldCheck, Lock, Loader2 } from "lucide-react";

const searchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional(),
  role: z.enum(["client", "lawyer"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in · JustiFile" },
      { name: "description", content: "Sign in or create your JustiFile account — for clients, lawyers, retired judges and notary publics." },
    ],
  }),
  component: AuthPage,
});

type LawyerCategory = "regular_advocate" | "san" | "retired_judge" | "notary_public";

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">(search.tab ?? "login");
  const [accountType, setAccountType] = useState<"client_individual" | "client_corporate" | "lawyer">(
    search.role === "lawyer" ? "lawyer" : "client_individual",
  );
  const [lawyerCategory, setLawyerCategory] = useState<LawyerCategory>("regular_advocate");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back to JustiFile");
    navigate({ to: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const meta: Record<string, string> = {
      full_name: String(fd.get("full_name") || ""),
      account_type: accountType,
    };
    if (accountType === "lawyer") meta.lawyer_category = lawyerCategory;
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        data: meta,
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Welcome to JustiFile.");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[40%_60%]">
      {/* LEFT — chambers */}
      <aside className="relative hidden lg:flex flex-col justify-between bg-gradient-to-b from-[oklch(0.22_0.04_256)] to-[oklch(0.14_0.035_256)] p-12 overflow-hidden">
        <div className="naija-stripe absolute top-0 inset-x-0" />
        <Link to="/" className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-md bg-gradient-to-br from-[oklch(0.745_0.115_86)] to-[oklch(0.88_0.06_86)] flex items-center justify-center text-[oklch(0.18_0.035_256)]">
            <Scale className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl">JustiFile</span>
        </Link>

        <div className="relative">
          <Scale className="h-40 w-40 text-gold/15 mx-auto" strokeWidth={1} />
          <h2 className="font-display text-3xl text-center mt-8 leading-snug">
            Welcome to your<br />chambers.
          </h2>
          <p className="text-muted-foreground text-center mt-4 max-w-sm mx-auto">
            A verified, monitored environment for serious legal practice in Nigeria.
          </p>
        </div>

        <p className="font-display italic text-gold/80 text-sm text-center">
          Fiat justitia ruat caelum
        </p>
      </aside>

      {/* RIGHT — form */}
      <main className="bg-background flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <Scale className="h-6 w-6 text-gold" />
            <span className="font-display text-xl">JustiFile</span>
          </div>

          <div className="flex gap-1 p-1 rounded-lg bg-panel border border-border w-fit mb-8">
            <TabBtn active={tab === "login"} onClick={() => setTab("login")}>Sign in</TabBtn>
            <TabBtn active={tab === "signup"} onClick={() => setTab("signup")}>Create account</TabBtn>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <h1 className="font-display text-3xl md:text-4xl">Welcome back</h1>
              <p className="text-muted-foreground text-sm -mt-2">Sign in to manage your cases and consultations.</p>

              <Field label="Email">
                <input name="email" type="email" required autoComplete="email" className="input-legal" placeholder="you@chambers.ng" />
              </Field>
              <Field label="Password" trailing={<a href="#" className="text-gold text-xs hover:underline">Forgot password?</a>}>
                <input name="password" type="password" required autoComplete="current-password" className="input-legal" placeholder="••••••••" />
              </Field>

              <button type="submit" disabled={loading} className="btn-gold w-full mt-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Sign in securely
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              <h1 className="font-display text-3xl md:text-4xl">Create your account</h1>
              <p className="text-muted-foreground text-sm -mt-2">Join verified Nigerian legal practitioners and clients.</p>

              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">I am a</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <SegBtn active={accountType === "client_individual"} onClick={() => setAccountType("client_individual")}>Individual</SegBtn>
                  <SegBtn active={accountType === "client_corporate"} onClick={() => setAccountType("client_corporate")}>Corporate</SegBtn>
                  <SegBtn active={accountType === "lawyer"} onClick={() => setAccountType("lawyer")}>Lawyer</SegBtn>
                </div>
              </div>

              <Field label="Full name">
                <input name="full_name" required className="input-legal" placeholder="Barr. Adaeze Okonkwo" />
              </Field>
              <Field label="Email">
                <input name="email" type="email" required autoComplete="email" className="input-legal" placeholder="you@chambers.ng" />
              </Field>
              <Field label="Password" hint="Minimum 8 characters">
                <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input-legal" placeholder="••••••••" />
              </Field>

              {accountType === "lawyer" && (
                <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-gold">Practitioner category</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <SegBtn active={lawyerCategory === "regular_advocate"} onClick={() => setLawyerCategory("regular_advocate")}>Regular Advocate</SegBtn>
                      <SegBtn active={lawyerCategory === "san"} onClick={() => setLawyerCategory("san")}>Senior Advocate (SAN)</SegBtn>
                      <SegBtn active={lawyerCategory === "retired_judge"} onClick={() => setLawyerCategory("retired_judge")}>Retired Judge</SegBtn>
                      <SegBtn active={lawyerCategory === "notary_public"} onClick={() => setLawyerCategory("notary_public")}>Notary Public</SegBtn>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Category-specific credentials (SAN conferment year, court tenure, stamp registration) can be added on your profile after sign up.
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-gold w-full mt-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create my account
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Secure SSL connection · End-to-end encrypted</div>
            <div className="flex items-center gap-2"><Scale className="h-3.5 w-3.5 text-gold" /> Verified Nigerian Bar Association credential system</div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, hint, trailing, children }: { label: string; hint?: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {trailing}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition ${active ? "bg-gold text-[oklch(0.18_0.035_256)]" : "text-muted-foreground hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-xs px-3 py-2.5 rounded-md border transition text-left ${active ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}>
      {children}
    </button>
  );
}
