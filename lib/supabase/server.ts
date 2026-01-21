import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          // Next.js 16: cookies() は .getAll() ではなく store.getAll? が無いので、全取得を自前で返す
          // cookieStore.getAll が無い環境では、最低限 auth に必要な cookie だけ読む方式でOK
          const all = cookieStore.getAll?.();
          if (all) return all;

          // フォールバック（getAll が無い場合）
          const names = ["sb-access-token", "sb-refresh-token"];
          return names
            .map((name) => {
              const v = cookieStore.get(name)?.value;
              return v ? { name, value: v } : null;
            })
            .filter(Boolean) as { name: string; value: string }[];
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component から呼ばれた時などは set できないことがあるので無視
          }
        },
      },
    }
  );
}
