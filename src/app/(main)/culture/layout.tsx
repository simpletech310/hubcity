import MuseumNav from "@/components/culture/MuseumNav";

export default function CultureLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Sticky museum navigation */}
      <div className="sticky top-0 z-30 bg-midnight/95 backdrop-blur-lg border-b border-border-subtle">
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
