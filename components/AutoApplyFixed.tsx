"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ymToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isYM(v: string) {
  return /^\d{4}-\d{2}$/.test(v);
}

export default function AutoApplyFixed() {
  const supabase = createClient();
  const sp = useSearchParams();

  const targetMonth = useMemo(() => {
    const m = sp.get("m");
    return m && isYM(m) ? m : ymToday();
  }, [sp]);

  // 同じ月での多重実行をガード（ページ遷移で再マウントされても1回に抑える）
  const lastAppliedRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!targetMonth) return;
      if (lastAppliedRef.current === targetMonth) return;

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return;

      // 固定費一覧
      const { data: fixed, error: fixedErr } = await supabase
        .from("fixed_items")
        .select("id,type,amount,category,memo,day_of_month")
        .eq("user_id", user.id);

      if (fixedErr) return;
      if (!fixed || fixed.length === 0) {
        lastAppliedRef.current = targetMonth;
        return;
      }

      const [Y, M] = targetMonth.split("-");

      const rows = fixed.map((f) => {
        const dd = String(f.day_of_month).padStart(2, "0");
        return {
          user_id: user.id,
          type: f.type,
          amount: f.amount,
          category: f.category,
          memo: f.memo,
          date: `${Y}-${M}-${dd}`,
          source_fixed_id: f.id,
        };
      });

      const { error } = await supabase.from("transactions").insert(rows);

      // 重複で弾かれるのは想定内なので無視
      // それ以外もここではユーザー体験優先で黙ってスルー
      if (cancelled) return;

      lastAppliedRef.current = targetMonth;
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, targetMonth]);

  return null;
}
