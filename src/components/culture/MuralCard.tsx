import Link from "next/link";
import Icon from "@/components/ui/Icon";

type Mural = {
  id: string;
  title: string;
  artist_name: string | null;
  location: string | null;
  district: string | null;
  year: number | null;
  image_urls: string[] | null;
  slug: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  created_at: string;
};

interface MuralCardProps {
  mural: Mural;
}

export default function MuralCard({ mural }: MuralCardProps) {
  const imageUrl = mural.image_urls?.[0];

  return (
    <Link
      href={`/culture/murals/${mural.slug || mural.id}`}
      className="group block bg-card rounded-2xl border border-border-subtle overflow-hidden card-glow transition-all duration-300 hover:border-gold/20"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-gold/20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={mural.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-40"><Icon name="palette" size={28} /></span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading font-bold text-text-primary truncate">
          {mural.title}
        </h3>
        {mural.artist_name && (
          <p className="text-sm text-text-secondary mt-1">
            by {mural.artist_name}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-warm-gray">
          {mural.location && <span>{mural.location}</span>}
          {mural.year && <span>{mural.year}</span>}
        </div>
        {mural.district && (
          <span className="inline-block mt-2 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-gold/10 text-gold border border-gold/20">
            {mural.district}
          </span>
        )}
      </div>
    </Link>
  );
}

export type { Mural };
