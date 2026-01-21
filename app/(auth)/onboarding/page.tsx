"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nickname, setNickname] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.replace("/login");
    })();
  }, [router, supabase]);

  async function save() {
    setMsg(null);
    const name = nickname.trim();
    if (name.length < 2) {
      setMsg("ニックネームは2文字以上にして");
      return;
    }
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, nickname: name });

      if (error) throw error;

      router.replace("/input");
    } catch (e: any) {
      setMsg(e?.message ?? "保存に失敗した");
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
            ニックネーム設定
          </h1>

          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            アプリ内で表示する名前を決める
          </p>

          <input
            className="mt-6 w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text)",
            }}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例：じょん"
          />

          {msg && (
            <div
              className="mt-4 rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              {msg}
            </div>
          )}

          <button
            onClick={save}
            disabled={loading}
            className="mt-6 w-full rounded-2xl px-4 py-3 text-sm"
            style={{ background: "rgba(180,200,255,0.18)" }}
          >
            {loading ? "保存中..." : "保存して続行"}
          </button>
        </div>
      </div>
    </main>
  );
}
