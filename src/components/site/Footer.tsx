import { Scale, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="naija-stripe opacity-60" />
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-5 w-5 text-gold" />
            <span className="font-display text-lg font-semibold">JustiFile</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Infrastructure for the Nigerian legal community. Verified practitioners, transparent ratings, secure escrow.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Platform</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="/lawyers" className="hover:text-foreground">Lawyer Directory</a></li>
            <li><a href="/submit-case" className="hover:text-foreground">Submit a Case</a></li>
            <li><a href="/#how" className="hover:text-foreground">How it works</a></li>
            <li><a href="/auth" className="hover:text-foreground">Join as a Lawyer</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
            <li>Rule 13 Compliance</li>
            <li>Pro Bono Charter</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Trust</h4>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <span>NBA credential verification</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/80">
            JustiFile operates under the principle that innovative methods of dispensing justice are encouraged.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} JustiFile · Founded by A.G. Ademola-Bank Esq. · Lagos, Nigeria
      </div>
    </footer>
  );
}
