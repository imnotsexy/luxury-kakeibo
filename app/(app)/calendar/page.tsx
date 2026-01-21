"use client";

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
  date: string; // YYYY-MM-DD
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
  return { y, m, first, last, lastDate };
}

function weekdayOfFirst(y: number, m: number) {
  // JS Date: month is 0-11
  return new Date(y, m - 1, 1).getDay(); // 0=Sun
}

type DaySum = { expense: number; income: number };
type MonthMap = Record<string, DaySum>; // key=YYYY-MM-DD

export default function CalendarPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [baseDate, setBaseDate] = useState(todayISO()); // 表示中の月を決める
  const { y, m, first, last, lastDate } = useMemo(
    () => monthRange(baseDate),
    [baseDate]
  );

  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => todayISO());

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
        .lte("date", last)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTxs((data ?? []) as Tx[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checking && userId) {
      fetchMonth();
      setSelectedDate(first); // 月が変わったら選択日を月初に寄せる
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, userId, y, m]);

  const dayMap: MonthMap = useMemo(() => {
    const map: MonthMap = {};
    for (const t of txs) {
      if (!map[t.date]) map[t.date] = { expense: 0, income: 0 };
      if (t.type === "expense") map[t.date].expense += t.amount;
      else map[t.date].income += t.amount;
    }
    return map;
  }, [txs]);

  const monthSummary = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const k of Object.keys(dayMap)) {
      expense += dayMap[k].expense;
      income += dayMap[k].income;
    }
    return { expense, income, total: income - expense };
  }, [dayMap]);

  const selectedTxs = useMemo(() => {
    return txs.filter((t) => t.date === selectedDate);
  }, [txs, selectedDate]);

  const firstWeekday = useMemo(() => weekdayOfFirst(y, m), [y, m]);

  const cells = useMemo(() => {
    // 6週*7日=42マス固定（見た目が崩れない）
    const result: Array<{ dateISO: string | null; day: number | null }> = [];
    for (let i = 0; i < firstWeekday; i++) result.push({ dateISO: null, day: null });
    for (let d = 1; d <= lastDate; d++) {
      const dd = String(d).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      result.push({ dateISO: `${y}-${mm}-${dd}`, day: d });
    }
    while (result.length < 42) result.push({ dateISO: null, day: null });
    return result;
  }, [firstWeekday, lastDate, y, m]);

  function prevMonth() {
    const d = new Date(y, m - 2, 1); // m-2 で前月（0-index換算）
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
    <Shell title="カレンダー">
      <div className="grid gap-6">
        {/* 月ヘッダー */}
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
            収入 {yen(monthSummary.income)} / 支出 {yen(monthSummary.expense)} / 合計{" "}
            {yen(monthSummary.total)}
          </div>
        </div>

        {/* カレンダー */}
        <div
          className="rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <div className="grid grid-cols-7 border-b px-2 py-2 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
              <div key={w} className="px-2 py-1">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px p-2" style={{ background: "var(--border)" }}>
            {cells.map((c, idx) => {
              if (!c.dateISO) {
                return <div key={idx} className="h-20 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }} />;
              }

              const sum = dayMap[c.dateISO];
              const selected = c.dateISO === selectedDate;

              const expense = sum?.expense ?? 0;
              const income = sum?.income ?? 0;
              const total = income - expense;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(c.dateISO!)}
                  className="h-20 rounded-xl border p-2 text-left"
                  style={{
                    borderColor: selected ? "rgba(180,200,255,0.55)" : "rgba(255,255,255,0.06)",
                    background: selected ? "rgba(180,200,255,0.10)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="text-sm">{c.day}</div>
                  {(expense !== 0 || income !== 0) && (
                    <div className="mt-1 text-[11px]" style={{ color: "var(--muted)" }}>
                      <div>合 {yen(total)}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="px-5 pb-4 text-sm" style={{ color: "var(--muted)" }}>
              Loading...
            </div>
          )}
        </div>

        {/* 選択日の明細 */}
        <div
          className="rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              {selectedDate} の明細
            </div>
          </div>

          <div className="border-t" style={{ borderColor: "var(--border)" }} />

          {selectedTxs.length === 0 ? (
            <div className="px-5 py-8 text-sm" style={{ color: "var(--muted)" }}>
              この日は記録がない
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {selectedTxs.map((t) => (
                <li key={t.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs rounded-full border px-2 py-0.5"
                          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                        >
                          {t.type === "expense" ? "支出" : "収入"}
                        </span>
                        <span className="text-sm">{t.category}</span>
                      </div>
                      {t.memo && (
                        <div className="mt-1 text-sm truncate" style={{ color: "var(--muted)" }}>
                          {t.memo}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-sm font-semibold">
                      {t.type === "expense" ? "-" : "+"}
                      {yen(t.amount)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Shell>
  );
}
