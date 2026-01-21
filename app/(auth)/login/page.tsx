"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("登録できた。次にログインして");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.replace("/input");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "エラーが発生した");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-md">
        <div
          className="rounded-2xl border p-8"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Luxury Kakeibo
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "ログイン" : "新規登録"}
          </h1>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--border)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--text)",
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
            />
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--border)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--text)",
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="password"
            />

            {msg && (
              <div
                className="rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}
              >
                {msg}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-2xl px-4 py-3 text-sm"
              style={{ background: "rgba(180,200,255,0.18)" }}
            >
              {loading ? "処理中..." : mode === "signin" ? "ログイン" : "登録する"}
            </button>
          </form>

          <button
            className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "新規登録へ" : "ログインへ"}
          </button>
        </div>
      </div>
    </main>
  );
}
