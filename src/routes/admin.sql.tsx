import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play } from "lucide-react";

export const Route = createFileRoute("/admin/sql")({
  component: SqlAdmin,
});

function SqlAdmin() {
  const [sql, setSql] = useState("SELECT id, full_name, account_type FROM profiles LIMIT 20");
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true); setErr(null); setRows([]);
    const { data, error } = await (supabase.rpc as any)("admin_run_sql", { _sql: sql });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setRows(Array.isArray(data) ? data : []);
  };

  const cols = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">SQL runner</h1>
      <p className="text-xs text-muted-foreground mb-4">Super admin only · read-only · wrapped in a SELECT — write your statement without a trailing semicolon.</p>
      <textarea value={sql} onChange={(e) => setSql(e.target.value)} rows={6} className="w-full font-mono text-sm p-3 rounded-md bg-card border border-border" />
      <div className="mt-2 flex justify-end">
        <button onClick={run} disabled={busy} className="btn-gold inline-flex items-center gap-2"><Play className="h-4 w-4" /> {busy ? "Running…" : "Run"}</button>
      </div>
      {err && <pre className="mt-4 p-3 rounded bg-red-500/10 text-red-400 text-xs whitespace-pre-wrap">{err}</pre>}
      {rows.length > 0 && (
        <div className="mt-4 rounded-lg border border-border overflow-auto max-h-[60vh]">
          <table className="w-full text-xs">
            <thead className="bg-card/60 text-left sticky top-0">
              <tr>{cols.map((c) => <th key={c} className="p-2">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {cols.map((c) => <td key={c} className="p-2 align-top max-w-xs truncate">{typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === 0 && !err && !busy && <p className="text-xs text-muted-foreground mt-4">No results yet.</p>}
    </div>
  );
}
