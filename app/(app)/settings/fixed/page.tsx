"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/client";

type Fixed = {
  id: number;
  type: "expense" | "income";
  amount: number;
  category: string;
  memo: string | null;
  day_of_month: number;
  created_at: string;
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ym(dateISO: string) {
  return dateISO.slice(0, 7);
}

function yen(n: number) {
  return new Intl.NumberFormat("ja-JP").format(n) + "円";
}

export default function FixedItemsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [list, setList] = useState<Fixed[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 登録フォーム
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [memo, setMemo] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const monthStr = useMemo(() => ym(todayISO()), []);

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

  async function fetchList() {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fixed_items")
        .select("id,type,amount,category,memo,day_of_month,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setList((data ?? []) as Fixed[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checking && userId) fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, userId]);

  async function add() {
    setMsg(null);
    if (!userId) return;

    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setMsg("金額は1以上で入れて");
    if (!category.trim()) return setMsg("カテゴリを入れて");
    if (dayOfMonth < 1 || dayOfMonth > 28) return setMsg("日は1〜28にして");

    const { error } = await supabase.from("fixed_items").insert({
      user_id: userId,
      type,
      amount: Math.trunc(n),
      category: category.trim(),
      memo: memo.trim() || null,
      day_of_month: dayOfMonth,
    });

    if (error) return setMsg(error.message);

    setAmount("");
    setCategory("");
    setMemo("");
    setDayOfMonth(1);
    setMsg("追加した");
    await fetchList();
  }

  async function remove(id: number) {
    if (!confirm("削除する？")) return;
    const { error } = await supabase.from("fixed_items").delete().eq("id", id);
    if (error) return setMsg(error.message);
    await fetchList();
  }

  async function applyThisMonth() {
    setMsg(null);
    if (!userId) return;

    // 固定費を transactions に反映
    // date は「今月 + day_of_month」
    const [Y, M] = monthStr.split("-").map(Number);

    const rows = list.map((f) => {
      const dd = String(f.day_of_month).padStart(2, "0");
      const mm = String(M).padStart(2, "0");
      const date = `${Y}-${mm}-${dd}`;

      return {
        user_id: userId,
        type: f.type,
        amount: f.amount,
        category: f.category,
        memo: f.memo,
        date,
        source_fixed_id: f.id,
      };
    });

    if (rows.length === 0) return setMsg("固定費がまだない");

    const { error } = await supabase.from("transactions").insert(rows);
    if (error) {
      // すでに入ってる（月内に反映済み）場合は unique index で弾かれる
      setMsg("反映済みか、重複がある。必要なら明細を確認して");
      return;
    }

    setMsg(`今月に反映した（${rows.length}件）`);
  }

  if (checking) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <Shell title="固定費・定期収入">
      <div className="grid gap-6">
        {/* 追加フォーム */}
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            毎月の定期項目を登録（1〜28日）
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

          <div className="mt-5 grid gap-3">
            <Input label="金額" value={amount} onChange={setAmount} placeholder="例 9800" />
            <Input label="カテゴリ" value={category} onChange={setCategory} placeholder="例 家賃" />
            <Input label="メモ" value={memo} onChange={setMemo} placeholder="任意" />
            <div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>日（毎月）</div>
              <input
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text)",
                }}
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
              />
            </div>
          </div>

          {msg && (
            <div className="mt-4 rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              {msg}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={add}
              className="rounded-2xl px-4 py-3 text-sm"
              style={{ background: "rgba(180,200,255,0.18)" }}
            >
              追加
            </button>
            <button
              onClick={applyThisMonth}
              className="rounded-2xl border px-4 py-3 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              今月に反映
            </button>
          </div>
        </div>

        {/* 一覧 */}
        <div
          className="rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--panel)" }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              登録済み（{list.length}件）
            </div>
            <button
              onClick={fetchList}
              className="rounded-lg border px-3 py-1 text-xs"
              style={{ borderColor: "var(--border)", opacity: 0.8 }}
            >
              更新
            </button>
          </div>

          <div className="border-t" style={{ borderColor: "var(--border)" }} />

          {loading ? (
            <div className="px-5 py-6 text-sm" style={{ color: "var(--muted)" }}>
              Loading...
            </div>
          ) : list.length === 0 ? (
            <div className="px-5 py-8 text-sm" style={{ color: "var(--muted)" }}>
              まだない
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {list.map((f) => (
                <li key={f.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs rounded-full border px-2 py-0.5"
                          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                        >
                          {f.type === "expense" ? "支出" : "収入"}
                        </span>
                        <span className="text-sm">{f.category}</span>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          毎月{f.day_of_month}日
                        </span>
                      </div>
                      {f.memo && (
                        <div className="mt-1 text-sm truncate" style={{ color: "var(--muted)" }}>
                          {f.memo}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold">{yen(f.amount)}</div>
                      <button
                        onClick={() => remove(f.id)}
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

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="text-sm" style={{ color: "var(--muted)" }}>{label}</div>
      <input
        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none"
        style={{
          borderColor: "var(--border)",
          background: "rgba(255,255,255,0.04)",
          color: "var(--text)",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
