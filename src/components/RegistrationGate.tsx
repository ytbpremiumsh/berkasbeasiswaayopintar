import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LockKeyhole, Loader2 } from "lucide-react";
import { getRegistrationStatus, type RegistrationStatus } from "@/lib/registration-status";
import { Button } from "@/components/ui/button";

export function RegistrationGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const reload = useCallback(() => setRetry(value => value + 1), []);
  useEffect(() => {
    let active = true;
    let pending = false;
    const check = async () => {
      if (pending) return;
      pending = true;
      try {
        const next = await getRegistrationStatus();
        if (active) { setStatus(next); setError(""); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Gagal memeriksa status pendaftaran.");
      } finally { pending = false; }
    };
    void check();
    const timer = window.setInterval(() => { if (!document.hidden) void check(); }, 60000);
    const focus = () => { void check(); };
    window.addEventListener("focus", focus);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [retry]);

  if (!error && status?.is_open) return <>{children}</>;
  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-background p-6">
      <section className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm" aria-live="polite">
        {!error && !status ? <><Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" /><p>Memeriksa status pendaftaran...</p></> : <>
          <LockKeyhole className="mx-auto mb-5 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">{error ? "Form sementara tidak tersedia" : "Pendaftaran Ditutup"}</h1>
          <p className="mt-4 whitespace-pre-wrap break-words text-muted-foreground">{error || status?.closed_message}</p>
          {error && <Button className="mt-6" variant="outline" onClick={reload}>Coba lagi</Button>}
        </>}
      </section>
    </main>
  );
}
