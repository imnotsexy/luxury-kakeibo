import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Components / Route Handlers で使う Supabase client
 * - Next.js の cookies() が Promise になる環境に対応（await）
 * - env 未設定のときは原因が分かるように明示的にエラーにする
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Next.js のバージョンによって cookies() が async のため await する
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component など set が禁止されるコンテキストで呼ばれても落とさない
        }
      },
    },
  });
}
