export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div
          className="rounded-2xl border p-8"
          style={{
            borderColor: "var(--border)",
            background: "var(--panel)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            kakeibo-app
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Luxury Kakeibo
          </h1>

          <p className="mt-4 leading-relaxed" style={{ color: "var(--muted)" }}>
            黒で静かな家計簿。  
            今日はログインとニックネーム設定まで作る。
          </p>

          <div className="mt-8 flex gap-3">
            <button
              className="rounded-xl border px-4 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              Sign in
            </button>

            <button
              className="rounded-xl px-4 py-2 text-sm"
              style={{ background: "rgba(255,255,255,0.10)" }}
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
