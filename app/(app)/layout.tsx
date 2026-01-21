import BottomNav from "@/components/BottomNav";
import { Suspense } from "react";
import AutoApplyFixed from "@/components/AutoApplyFixed";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
    <Suspense fallback={null}>
      <AutoApplyFixed />
    </Suspense>
    
      {children}
      <BottomNav />
    </>
  );
}
