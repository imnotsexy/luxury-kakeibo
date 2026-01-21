"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type Tx = {
  id: number;
  type: "expense" | "income";
  amount: number;
  category: string;
  memo: string | null;
  date: string;
  created_at: string;
};

function yen(n: number) {
  return new Intl.NumberFormat("ja-JP").format(n) + "円";
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthRange(dateISO: string) {
  const [y, m] = dateISO.split("-").map(Number);
  const first = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDate = new Date(y, m, 0).getDate();
  const last = `${y}-${String(m).padStart(2, "0")}-${String(lastDate).padStart(
    2,
    "0"
  )}`;
  return { y, m, first, last };
}

type Item = { name: string; value: number };

export default function GraphPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [baseDate, setBaseDate] = useState(todayISO());
  const { y, m, first, last } = useMemo(() => monthRange(baseDate), [baseDate]);

  const [type, setType] = useState<"expense" | "income">("expense");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      setChecking(false);
    })();
  }, [router, supabase]);

  async function fetchMonth() {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id,type,amount,category,memo,date,created_at")
        .eq("user_id", userId)
        .gte("date", first)
        .lte("date", last);

      if (error) throw error;
      setTxs((data ?? []) as Tx[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checking && userId) fetchMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, userId, y, m]);

  const items: Item[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txs) {
      if (t.type !== type) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [txs, type]);

  const total = useMemo(() => items.reduce((s, x) => s + x.value, 0), [items]);

  // 黒系に合う「淡いブルー〜グレー」固定パレット（落ち着き優先）
  const palette = [
    "rgba(180,200,255,0.65)",
    "rgba(180,200,255,0.45)",
    "rgba(180,200,255,0.30)",
    "rgba(255,255,255,0.18)",
    "rgba(255,255,255,0.12)",
    "rgba(255,255,255,0.08)",
  ];

  function prevMonth() {
    const d = new Date(y, m - 2, 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    setBaseDate(`${yy}-${mm}-01`);
  }

  function nextMonth() {
    const d = new Date(y, m, 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    setBaseDate(`${yy}-${mm}-01`);
  }

  if (checking) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <Shell title="グラフ">
      <div className="grid gap-6">
        {/* 月 & タブ */}
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              ◀
            </button>

            <div className="text-lg font-semibold tracking-tight">
              {y}年{String(m).padStart(2, "0")}月
            </div>

            <button
              onClick={nextMonth}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              ▶
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--border)",
                background:
                  type === "expense" ? "rgba(255,255,255,0.08)" : "transparent",
                color: type === "expense" ? "var(--text)" : "var(--muted)",
              }}
              onClick={() => setType("expense")}
            >
              支出
            </button>
            <button
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--border)",
                background:
                  type === "income" ? "rgba(255,255,255,0.08)" : "transparent",
                color: type === "income" ? "var(--text)" : "var(--muted)",
              }}
              onClick={() => setType("income")}
            >
              収入
            </button>
          </div>
        </div>

        {/* ドーナツ */}
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          {loading ? (
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              データがない
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={items}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth={1}
                    >
                      {items.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    合計
                  </div>
                  <div className="mt-1 text-xl font-semibold">{yen(total)}</div>
                </div>
              </div>

              <div
                className="rounded-2xl border"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                  カテゴリ別
                </div>
                <div className="border-t" style={{ borderColor: "var(--border)" }} />
                <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {items.map((it, i) => (
                    <li key={it.name} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: palette[i % palette.length] }}
                          />
                          <span className="truncate text-sm">{it.name}</span>
                        </div>
                        <div className="text-sm font-semibold">{yen(it.value)}</div>
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                        {total === 0 ? "0%" : Math.round((it.value / total) * 100)}%
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
