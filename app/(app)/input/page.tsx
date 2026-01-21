"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";


function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthRangeISO(dateISO: string) {
  const [y, m] = dateISO.split("-").map(Number);
  const first = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDate = new Date(y, m, 0).getDate(); // m は 1-12
  const last = `${y}-${String(m).padStart(2, "0")}-${String(lastDate).padStart(
    2,
    "0"
  )}`;
  return { first, last };
}

const expenseCategories = ["食費", "住居費", "交通", "日用品", "交際", "その他"];
const incomeCategories = ["給与", "副収入", "臨時収入", "その他"];

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

export default function InputPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("食費");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(todayISO());

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [txs, setTxs] = useState<Tx[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const categories = useMemo(
    () => (type === "expense" ? expenseCategories : incomeCategories),
    [type]
  );

  const month = useMemo(() => date.slice(0, 7), [date]);
  const { first, last } = useMemo(() => monthRangeISO(date), [date]);

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

  useEffect(() => {
    setCategory(type === "expense" ? "食費" : "給与");
  }, [type]);

  async function fetchMonth() {
    if (!userId) return;
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id,type,amount,category,memo,date,created_at")
        .eq("user_id", userId)
        .gte("date", first)
        .lte("date", last)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTxs((data ?? []) as Tx[]);
    } finally {
      setLoadingList(false);
    }
  }

  async function applyFixedIfNeeded(targetMonth: string) {
  if (!userId) return;

  const { data: fixed, error: fixedErr } = await supabase
    .from("fixed_items")
    .select("id,type,amount,category,memo,day_of_month")
    .eq("user_id", userId);

  if (fixedErr) throw fixedErr;
  if (!fixed || fixed.length === 0) return;

  const [Y, M] = targetMonth.split("-");

  const rows = fixed.map((f) => {
    const dd = String(f.day_of_month).padStart(2, "0");
    return {
      user_id: userId,
      type: f.type,
      amount: f.amount,
      category: f.category,
      memo: f.memo,
      date: `${Y}-${M}-${dd}`,
      source_fixed_id: f.id,
    };
  });

  // 重複は unique index で弾かれる（エラーになっても致命じゃない）
  const { error } = await supabase.from("transactions").insert(rows);
  if (error) {
    // すでに反映済みの重複はここに来ることがあるので無視でOK
    // ほかのエラーだけ見たいなら console.log してもいい
  }
}


  useEffect(() => {
  if (!checking && userId) {
    applyFixedIfNeeded(month).then(() => fetchMonth());
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [checking, userId, month]);

  async function save() {
    setMsg(null);
    if (!userId) return;

    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setMsg("金額は1以上の数字で入れて");
      return;
    }
    if (!date) {
      setMsg("日付を入れて");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        type,
        amount: Math.trunc(n),
        category: category.trim(),
        memo: memo.trim() || null,
        date,
      });

      if (error) throw error;

      setMsg("保存した");
      setAmount("");
      setMemo("");

      await fetchMonth(); // 追加後に即リロード
    } catch (e: any) {
      setMsg(e?.message ?? "保存に失敗した");
    } finally {
      setSaving(false);
    }
  }

  async function removeTx(id: number) {
    if (!confirm("削除する？")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    await fetchMonth();
  }

  const monthSummary = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const t of txs) {
      if (t.type === "expense") expense += t.amount;
      else income += t.amount;
    }
    return { expense, income, total: income - expense };
  }, [txs]);

  if (checking) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <Shell title="入力">
      <div className="grid gap-6">
        {/* 入力フォーム */}
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <div className="flex gap-2">
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

          <div className="mt-6 space-y-4">
            <Field label="金額">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text)",
                }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                placeholder="例 1200"
              />
            </Field>

            <Field label="カテゴリ">
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text)",
                }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="メモ">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text)",
                }}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="品目やお店"
              />
            </Field>

            <Field label="日付">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text)",
                }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
              />
            </Field>
          </div>

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
            disabled={saving}
            className="mt-6 w-full rounded-2xl px-4 py-3 text-sm"
            style={{ background: "rgba(180,200,255,0.18)" }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        {/* 当月サマリー */}
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <div className="flex items-end justify-between">
            <div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                {month} の合計
              </div>
              <div className="mt-1 text-xl font-semibold">
                {yen(monthSummary.total)}
              </div>
            </div>
            <div className="text-right text-sm" style={{ color: "var(--muted)" }}>
              <div>収入 {yen(monthSummary.income)}</div>
              <div>支出 {yen(monthSummary.expense)}</div>
            </div>
          </div>
        </div>

        {/* 一覧 */}
        <div
          className="rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              履歴（当月）
            </div>
            <button
              onClick={fetchMonth}
              className="rounded-lg border px-3 py-1 text-xs"
              style={{ borderColor: "var(--border)", opacity: 0.8 }}
            >
              更新
            </button>
          </div>

          <div className="border-t" style={{ borderColor: "var(--border)" }} />

          {loadingList ? (
            <div className="px-5 py-4 text-sm" style={{ color: "var(--muted)" }}>
              Loading...
            </div>
          ) : txs.length === 0 ? (
            <div className="px-5 py-8 text-sm" style={{ color: "var(--muted)" }}>
              まだ記録がない
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {txs.map((t) => (
                <li key={t.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs rounded-full border px-2 py-0.5"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--muted)",
                          }}
                        >
                          {t.type === "expense" ? "支出" : "収入"}
                        </span>
                        <span className="text-sm">{t.category}</span>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          {t.date}
                        </span>
                      </div>
                      {t.memo && (
                        <div className="mt-1 text-sm truncate" style={{ color: "var(--muted)" }}>
                          {t.memo}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {t.type === "expense" ? "-" : "+"}
                        {yen(t.amount)}
                      </div>
                      <button
                        onClick={() => removeTx(t.id)}
                        className="mt-2 text-xs"
                        style={{ color: "var(--muted)", opacity: 0.8 }}
                      >
                        削除
                      </button>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b pb-3" style={{ borderColor: "var(--border)" }}>
      <div className="text-sm" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}