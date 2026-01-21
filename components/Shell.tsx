"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/useProfile";

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function Shell({ title, children }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const { nickname, loading } = useProfile();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          borderColor: "var(--border)",
          background: "rgba(11,11,12,0.92)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Luxury Kakeibo
            </div>
            {title && (
              <div className="mt-1 text-lg font-semibold tracking-tight">
                {title}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!loading && nickname && (
              <span className="text-sm opacity-80">{nickname}</span>
            )}
            <button
              onClick={logout}
              className="rounded-lg border px-3 py-1 text-xs"
              style={{ borderColor: "var(--border)", opacity: 0.8 }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-6">
        {children}
      </main>
    </div>
  );
}
