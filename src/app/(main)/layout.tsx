import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ToastProvider from "@/components/ui/Toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[430px] mx-auto min-h-dvh relative bg-midnight selection:bg-gold/30 selection:text-white">
      <Header />
      <main className="pt-[64px] pb-24 pb-safe overflow-y-auto overflow-x-hidden scrollbar-hide">
        {children}
      </main>
      <BottomNav />
      <ToastProvider />
    </div>
  );
}
