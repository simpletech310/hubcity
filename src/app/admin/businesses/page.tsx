import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/types/database";

export default async function AdminBusinessesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  const businesses = (data as Business[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Businesses</h1>
          <p className="text-sm text-txt-secondary">
            {businesses.length} total businesses
          </p>
        </div>
        <Link href="/admin/businesses/new"><Button>+ Add Business</Button></Link>
      </div>

      <div className="space-y-2">
        {businesses.map((biz) => (
          <Card key={biz.id} hover>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">{biz.name}</h3>
                  {biz.is_featured && <Badge label="Featured" variant="gold" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={biz.category} variant="purple" />
                  {biz.district && (
                    <span className="text-xs text-txt-secondary">
                      District {biz.district}
                    </span>
                  )}
                  <span className="text-xs text-gold">★ {Number(biz.rating_avg).toFixed(1)}</span>
                  <span className="text-xs text-txt-secondary">({biz.rating_count} reviews)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  label={biz.is_published ? "Published" : "Draft"}
                  variant={biz.is_published ? "emerald" : "gold"}
                />
                <Link href={`/admin/businesses/${biz.id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
