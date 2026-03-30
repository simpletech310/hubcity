import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ToastProvider from "@/components/ui/Toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[430px] mx-auto min-h-dvh relative bg-midnight">
      <Header />
      <main className="pt-[72px] pb-safe overflow-y-auto overflow-x-hidden scrollbar-hide">
        {children}
      </main>
      <BottomNav />
      <ToastProvider />
    </div>
  );
}
