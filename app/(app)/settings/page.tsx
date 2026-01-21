"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Tx = {
  id: number;
  type: "expense" | "income";
  amount: number;
  category: string;
  memo: string | null;
  date: string;
  created_at: string;
};

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

function toCSV(rows: Tx[]) {
  const header = ["date", "type", "amount", "category", "memo", "created_at"];
  const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const line = (arr: string[]) => arr.map(esc).join(",");

  const body = rows.map((r) =>
    line([
      r.date,
      r.type,
      String(r.amount),
      r.category,
      r.memo ?? "",
      r.created_at,
    ])
  );

  return [line(header), ...body].join("\n");
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [baseDate, setBaseDate] = useState(todayISO());
  const { y, m, first, last } = useMemo(() => monthRange(baseDate), [baseDate]);

  const [msg, setMsg] = useState<string | null>(null);
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

  async function exportCSV() {
    if (!userId) return;
    setMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id,type,amount,category,memo,date,created_at")
        .eq("user_id", userId)
        .gte("date", first)
        .lte("date", last)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as Tx[];
      const csv = toCSV(rows);
      downloadText(`kakeibo_${y}-${String(m).padStart(2, "0")}.csv`, csv);

      setMsg(`CSVを出力した（${rows.length}件）`);
    } catch (e: any) {
      setMsg(e?.message ?? "CSV出力に失敗した");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <div style={{ padding: 24 }}>Loading...</div>;

  const rows = [
  { label: "固定費・定期収入", href: "/settings/fixed" },
  { label: "入れ忘れ防止通知" },
  { label: "月の開始日" },
  { label: "テーマカラー" },
  { label: "自動バックアップ" },
  { label: "パスコードロック（PIN）" },
];

  return (
    <Shell title="設定">
      <div className="grid gap-6">
        {/* 月選択 */}
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

          <div className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            この月のデータをCSVで出力する
          </div>

          <button
            onClick={exportCSV}
            disabled={loading}
            className="mt-5 w-full rounded-2xl px-4 py-3 text-sm"
            style={{ background: "rgba(180,200,255,0.18)" }}
          >
            {loading ? "出力中..." : "CSVエクスポート"}
          </button>

          {msg && (
            <div
              className="mt-4 rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              {msg}
            </div>
          )}
        </div>

        {/* 次フェーズ（見た目だけ先に置く） */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          {rows.map((r) => {
          const rowUI = (
            <div
              className="flex items-center justify-between px-5 py-4 border-b last:border-b-0"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-sm">{r.label}</span>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                ›
              </span>
            </div>
          );

          return r.href ? (
            <Link key={r.label} href={r.href} className="block">
              {rowUI}
            </Link>
          ) : (
            <div key={r.label}>{rowUI}</div>
          );
        })}

        </div>
      </div>
    </Shell>
  );
}
