"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

export default function LandingApple() {
  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, 24]);
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.98]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.55]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* 背景グロー - より深みのある多層グラデーション */}
      <motion.div
        style={{ opacity: glowOpacity }}
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% -20%, rgba(120,160,255,0.15) 0%, transparent 80%), radial-gradient(circle at 0% 40%, rgba(255,255,255,0.03) 0%, transparent 50%)",
          }}
        />
      </motion.div>

      {/* ナビ */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-sm font-medium tracking-widest uppercase opacity-80">
            Luxury Kakeibo
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
              ログイン
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-opacity-90 transition-all"
            >
              今すぐ始める
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="mx-auto max-w-6xl px-6 pt-24 pb-32 text-center md:text-left">
          <motion.div style={{ y: heroY, scale: heroScale }}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                New Standard for Finance
              </span>
              <h1 className="mt-8 text-5xl font-bold tracking-tight md:text-8xl bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                お金を整える、<br />心を整える。
              </h1>
              <p className="mt-8 max-w-2xl text-lg md:text-xl leading-relaxed opacity-60">
                Luxury Kakeiboは、単なる記録ツールではありません。
                あなたの資産を「美しく可視化」し、支出の質を高めるための、プライベート・コンシェルジュです。
              </p>
            </motion.div>

            <div className="mt-12 flex flex-col gap-4 sm:flex-row justify-center md:justify-start">
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-white/10 px-8 py-4 text-sm font-semibold transition-all hover:bg-white/20"
              >
                無料でアカウントを作成
              </Link>
              <button className="text-sm font-medium opacity-50 hover:opacity-100 transition-opacity">
                機能を詳しく見る →
              </button>
            </div>
          </motion.div>
        </section>

        {/* PRO FEATURES SECTIONS (追加分) */}
        <section className="mx-auto max-w-6xl px-6 py-24 border-t border-white/5">
          <div className="grid gap-12 md:grid-cols-3">
            {[
              { 
                t: "100msの即応性", 
                d: "独自のキャッシュ最適化により、入力から反映まで一瞬。あなたの思考を止めません。" 
              },
              { 
                t: "銀行級のセキュリティ", 
                d: "データはエンドツーエンドで暗号化。私たちですら、あなたの支出を知ることはできません。" 
              },
              { 
                t: "インテリジェント予測", 
                d: "過去のデータから来月の支出を予測。ゆとりある資金計画をサポートします。" 
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-4"
              >
                <div className="h-px w-8 bg-blue-500" />
                <h3 className="text-xl font-semibold">{item.t}</h3>
                <p className="text-sm leading-relaxed opacity-50">{item.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 端末パネルセクションのブラッシュアップ */}
        <section className="mx-auto max-w-6xl px-6 pb-32">
          <div
            className="rounded-[2.5rem] border p-1 overflow-hidden"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
            }}
          >
            <div className="rounded-[2.4rem] bg-black/40 p-8 md:p-16 backdrop-blur-3xl">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-semibold italic">"Less, but better."</h2>
                <p className="mt-4 opacity-40">より少なく、しかしより良く。</p>
              </div>
              
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <h3 className="text-2xl font-medium">固定費のインテリジェント自動化</h3>
                  <p className="opacity-60 leading-relaxed">
                    毎月の家賃、保険料、サブスクリプション。一度設定すれば、システムがカレンダーと同期。
                    「忘れていた支出」をゼロにします。
                  </p>
                  <ul className="space-y-3 text-sm opacity-80">
                    <li className="flex items-center gap-2">✓ 決済日前の通知機能</li>
                    <li className="flex items-center gap-2">✓ 月次レポートの自動生成</li>
                    <li className="flex items-center gap-2">✓ カテゴリの自動分類</li>
                  </ul>
                </div>
                {/* ここにプレビュー画像やグラフのモックを配置 */}
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center">
                   <div className="text-blue-400/50 text-sm">Dashboard Preview</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="py-12 border-t border-white/5 text-center opacity-30 text-xs tracking-[0.2em]">
        &copy; 2024 LUXURY KAKEIBO. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}