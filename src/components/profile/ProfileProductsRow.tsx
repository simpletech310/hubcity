import Link from "next/link";
import Icon from "@/components/ui/Icon";

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  price: number; // cents
  image_url: string | null;
  category: string | null;
}

interface ProfileProductsRowProps {
  products: ProductItem[];
  /** Used to build the "see all" link: /business/[slug or id]. */
  businessSlug: string | null;
  businessId: string;
  /** Override the row title (defaults to "Products"). */
  title?: string;
}

export default function ProfileProductsRow({
  products,
  businessSlug,
  businessId,
  title = "Products",
}: ProfileProductsRowProps) {
  if (products.length === 0) return null;

  const shopHref = `/business/${businessSlug || businessId}`;
  const orderHref = `/business/${businessSlug || businessId}/order`;

  return (
    <div>
      <div className="px-5 mb-3 flex items-center justify-between">
        <h2 className="font-heading font-semibold text-sm text-white/50 uppercase tracking-wider flex items-center gap-2">
          <Icon name="shopping" size={16} className="text-emerald" /> {title}
        </h2>
        <Link href={shopHref} className="text-[11px] text-gold font-semibold press">
          Shop all
        </Link>
      </div>

      <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 snap-x snap-mandatory pb-1">
          {products.map((p) => (
            <Link
              key={p.id}
              href={orderHref}
              className="snap-start shrink-0 w-[150px] group press"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.05] border border-white/[0.05]">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Icon name="shopping" size={22} />
                  </div>
                )}
              </div>
              <div className="pt-2 px-0.5">
                <p className="text-[12px] font-semibold text-white line-clamp-1">{p.name}</p>
                <p className="text-[11px] font-bold text-gold">
                  ${(p.price / 100).toFixed(2)}
                </p>
                {p.category && (
                  <p className="text-[10px] text-white/40 line-clamp-1 mt-0.5">
                    {p.category}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
