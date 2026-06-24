import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import heroImg from "@/assets/hero-chambers.jpg";
import { Scale, Gavel, ShieldCheck, Sparkles, Users, BadgeCheck, Wallet, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JustiFile — Access to Justice for Nigeria" },
      { name: "description", content: "Connect with verified Nigerian lawyers, SANs, retired judges and notary publics. Paid representation, pro bono pool, transparent ratings, secure escrow." },
      { property: "og:title", content: "JustiFile — Access to Justice for Nigeria" },
      { property: "og:description", content: "Verified Nigerian legal practitioners. Paid & pro bono cases." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{ backgroundImage: `url(${heroImg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Built for Nigerian legal practice
            </div>
            <h1 className="font-display mt-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
              Justice, <span className="text-gradient-gold">delivered</span> with dignity.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              JustiFile connects everyday Nigerians and corporate clients with verified Advocates, SANs, Retired Judges and Notary Publics — paid representation when you can afford it, pro bono when you cannot.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/auth" search={{ tab: "signup", role: "lawyer" }} className="btn-gold">
                <Gavel className="h-4 w-4" /> Join as a Lawyer
              </Link>
              <Link to="/lawyers" className="btn-ghost-gold">
                <Scale className="h-4 w-4" /> Find a Lawyer
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              <span className="font-mono text-gold">Fiat justitia ruat caelum</span> — let justice be done though the heavens fall.
            </p>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-panel/80 backdrop-blur shadow-elegant p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Featured Counsel</p>
                  <p className="font-display text-xl mt-1">Adaeze Okonkwo, SAN</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/15 text-gold text-xs font-semibold">
                  <BadgeCheck className="h-3.5 w-3.5" /> SAN
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 py-5 text-sm">
                <Stat label="Rating" value="4.9" icon={<Star className="h-3.5 w-3.5 text-gold" />} />
                <Stat label="Cases" value="312" />
                <Stat label="Pro Bono" value="48" />
              </div>
              <div className="font-mono text-xs text-muted-foreground border-t border-border pt-4">
                NBA · SCN/2003/00481
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 w-56 rounded-xl border border-border bg-panel p-4 shadow-elegant hidden md:block">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5 text-gold" /> Escrow held
              </div>
              <p className="font-display text-2xl mt-1">₦1,250,000</p>
              <p className="text-xs text-muted-foreground mt-1">Released on case milestones</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section id="trust" className="border-y border-border bg-panel/40">
        <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <TrustItem icon={<ShieldCheck className="h-4 w-4" />} label="NBA-verified practitioners" />
          <TrustItem icon={<Users className="h-4 w-4" />} label="SANs · Retired Judges · Notaries" />
          <TrustItem icon={<Wallet className="h-4 w-4" />} label="Secure milestone escrow" />
          <TrustItem icon={<BadgeCheck className="h-4 w-4" />} label="Admin-monitored compliance" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-gold text-xs uppercase tracking-[0.2em]">How it works</p>
          <h2 className="font-display text-4xl md:text-5xl mt-3">From submission to verdict — without the friction.</h2>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Step n="01" title="Submit your case" desc="Describe the matter, jurisdiction (Penal or Criminal Code) and indicate whether you can pay or need pro bono representation." />
          <Step n="02" title="Match or browse" desc="Paying clients book directly from the directory. Pro bono cases enter the public pool for verified lawyers to claim." />
          <Step n="03" title="Consult, conclude, rate" desc="Communicate in-app under admin compliance. Escrow funds release on milestones. Lawyers earn stars from real outcomes." />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-panel/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-end mb-14">
            <div>
              <p className="text-gold text-xs uppercase tracking-[0.2em]">Who's on JustiFile</p>
              <h2 className="font-display text-4xl md:text-5xl mt-3">Four categories. One standard of excellence.</h2>
            </div>
            <p className="text-muted-foreground">
              Every practitioner is verified against NBA credentials and the appropriate Nigerian legal registries before appearing in the directory.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <CategoryCard title="Regular Advocate" desc="Practising lawyers building a verifiable case history through paid and pro bono work." />
            <CategoryCard title="Senior Advocate (SAN)" desc="Conferred members of the Inner Bar handling complex litigation and constitutional matters." badge="SAN" />
            <CategoryCard title="Retired Judge" desc="Former Bench members offering consultancy and arbitration with court-tested perspective." />
            <CategoryCard title="Notary Public" desc="Commissioners for oaths and document authentication with verified stamp registration." />
          </div>
        </div>
      </section>

      {/* PRO BONO STRIP */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-panel to-background p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/2 opacity-10 bg-gradient-gold blur-3xl" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-gold text-xs uppercase tracking-[0.2em]">Access to Justice</p>
              <h2 className="font-display text-4xl md:text-5xl mt-3">No one should face the law alone.</h2>
              <p className="mt-5 text-muted-foreground leading-relaxed max-w-lg">
                Prison cases and low-income clients are prioritised in the pro bono pool. Lawyers earn ranking stars based on the quantity and quality of pro bono cases handled — making credibility a matter of service, not connection.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Link to="/submit-case" className="btn-gold w-full md:w-auto self-start">Request pro bono assistance</Link>
              <Link to="/auth" search={{ tab: "signup", role: "lawyer" }} className="btn-ghost-gold w-full md:w-auto self-start">Claim a pro bono case</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <p className="font-display text-2xl mt-1">{value}</p>
    </div>
  );
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <span className="text-gold">{icon}</span>{label}
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel/60 p-7 hover:border-gold/40 transition">
      <p className="font-mono text-gold text-sm">{n}</p>
      <h3 className="font-display text-2xl mt-3">{title}</h3>
      <p className="text-muted-foreground mt-3 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function CategoryCard({ title, desc, badge }: { title: string; desc: string; badge?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-6 hover:border-gold/40 transition group">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">{title}</h3>
        {badge && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold/15 text-gold">{badge}</span>}
      </div>
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{desc}</p>
    </div>
  );
}
