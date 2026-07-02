import { Building2, CheckCircle2, LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result =
        mode === "login"
          ? await supabase!.auth.signInWithPassword({ email, password })
          : await supabase!.auth.signUp({ email, password });
      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden bg-forest p-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-coral">
            <Building2 />
          </span>
          <span className="font-display text-2xl font-bold">Rental Scout</span>
        </div>
        <div className="my-auto max-w-xl">
          <p className="eyebrow !text-mint/60">Your next acquisition starts here</p>
          <h1 className="mt-4 font-display text-6xl font-bold leading-[1.04]">
            Find the deal worth flying for.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/60">
            Compare rental economics, keep every insight, and arrive on the East Coast with a
            focused visit list.
          </p>
          <div className="mt-9 grid gap-3 text-sm font-semibold text-white/75">
            {["Private deal database", "HELOC-aware cash flow", "Smart trip planning"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="text-mint" size={18} /> {item}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-white">
              <Building2 size={20} />
            </span>
            <span className="font-display text-xl font-bold text-forest">Rental Scout</span>
          </div>
          <p className="eyebrow">{mode === "login" ? "Welcome back" : "Create your account"}</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-forest">
            {mode === "login" ? "Sign in to scout." : "Start your portfolio."}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Your properties and notes stay private to your account.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Email address</span>
              <input
                className="field"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Password</span>
              <input
                className="field"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </label>
            {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}
            {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
            <button className="btn-primary flex w-full items-center justify-center gap-2" disabled={busy}>
              {busy && <LoaderCircle size={17} className="animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? "New to Rental Scout?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-bold text-pine underline underline-offset-4"
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
