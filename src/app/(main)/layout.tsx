import { cookies } from "next/headers";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ToastProvider from "@/components/ui/Toast";
import { getAccess } from "@/lib/access";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ mode }, jar] = await Promise.all([getAccess(), cookies()]);
  const hasActiveCity = Boolean(jar.get("active_city")?.value);

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh relative bg-midnight selection:bg-gold/30 selection:text-white">
      <Header />
      <main className="pt-[64px] pb-24 pb-safe overflow-y-auto overflow-x-hidden scrollbar-hide">
        {children}
      </main>
      <BottomNav accessMode={mode} hasActiveCity={hasActiveCity} />
      <ToastProvider />
    </div>
  );
}
