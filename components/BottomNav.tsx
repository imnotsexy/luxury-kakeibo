"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/input", label: "入力" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/graph", label: "グラフ" },
  { href: "/settings", label: "設定" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t"
      style={{
        borderColor: "var(--border)",
        background: "rgba(11,11,12,0.92)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="mx-auto grid max-w-3xl grid-cols-4 px-2 py-2">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className="rounded-xl px-3 py-2 text-center text-sm"
              style={{
                color: active ? "var(--text)" : "var(--muted)",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
