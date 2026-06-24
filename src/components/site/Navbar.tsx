import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scale } from "lucide-react";

export function Navbar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="naija-stripe" />
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="h-9 w-9 rounded-md bg-gradient-to-br from-[oklch(0.745_0.115_86)] to-[oklch(0.88_0.06_86)] flex items-center justify-center text-[oklch(0.18_0.035_256)]">
            <Scale className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">JustiFile</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/lawyers" className="hover:text-foreground transition">Find a Lawyer</Link>
          <Link to="/submit-case" className="hover:text-foreground transition">Submit a Case</Link>
          <a href="/#how" className="hover:text-foreground transition">How it works</a>
          <a href="/#trust" className="hover:text-foreground transition">Trust & Safety</a>
        </nav>
        <div className="flex items-center gap-3">
          {email ? (
            <Link to="/dashboard" className="text-sm text-foreground/90 hover:text-gold">Dashboard</Link>
          ) : (
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          )}
          <Link to="/auth" search={{ tab: "signup" }} className="hidden sm:inline-flex items-center justify-center h-10 px-4 rounded-md bg-gradient-to-r from-[oklch(0.745_0.115_86)] to-[oklch(0.82_0.1_86)] text-[oklch(0.18_0.035_256)] text-sm font-semibold hover:brightness-110 transition">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
