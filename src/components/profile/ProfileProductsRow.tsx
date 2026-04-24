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
  businessSlug: string | null;
  businessId: string;
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
      <div
        className="px-5 mb-3 flex items-end justify-between pb-2"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        <div>
          <div className="c-kicker" style={{ color: "var(--ink-mute)" }}>
            § {title.toUpperCase()}
          </div>
        </div>
        <Link
          href={shopHref}
          className="c-kicker press"
          style={{ color: "var(--ink-strong)" }}
        >
          SHOP ALL →
        </Link>
      </div>

      <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 snap-x snap-mandatory pb-1">
          {products.map((p) => (
            <Link
              key={p.id}
              href={orderHref}
              className="snap-start shrink-0 w-[150px] group press block"
            >
              <div
                className="relative aspect-square c-frame overflow-hidden"
                style={{ background: "var(--paper)" }}
              >
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: "var(--ink-mute)" }}
                  >
                    <Icon name="shopping" size={22} />
                  </div>
                )}
              </div>
              <div className="pt-2">
                <p
                  className="c-card-t line-clamp-1"
                  style={{ fontSize: 13 }}
                >
                  {p.name}
                </p>
                <p
                  className="c-display c-tabnum mt-1"
                  style={{ fontSize: 18, color: "var(--ink-strong)" }}
                >
                  ${(p.price / 100).toFixed(2)}
                </p>
                {p.category && (
                  <p
                    className="c-kicker line-clamp-1 mt-0.5"
                    style={{ fontSize: 9, color: "var(--ink-mute)" }}
                  >
                    {p.category.toUpperCase()}
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
