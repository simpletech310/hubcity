import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Venue } from "@/types/database";
import Icon from "@/components/ui/Icon";

type VenueWithSections = Venue & { sections: { id: string }[] };

export default async function VenuesPage() {
  const supabase = await createClient();

  const { data: venues } = await supabase
    .from("venues")
    .select("*, sections:venue_sections(id)")
    .order("name", { ascending: true });

  const rows = (venues ?? []) as VenueWithSections[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Venues</h1>
          <p className="text-txt-secondary text-sm mt-0.5">
            Manage venues and their seating sections for ticketed events.
          </p>
        </div>
        <Link href="/admin/venues/new">
          <Button variant="primary" size="sm">
            + Add Venue
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3"><Icon name="building" size={28} /></p>
          <p className="text-txt-secondary text-sm">No venues yet.</p>
          <Link href="/admin/venues/new" className="mt-4 inline-block">
            <Button variant="primary" size="sm">Create your first venue</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((venue) => {
            const sectionCount = venue.sections?.length ?? 0;
            return (
              <Card key={venue.id} className="flex flex-col gap-3">
                {venue.image_url && (
                  <div className="h-32 rounded-lg overflow-hidden -mx-1">
                    <img
                      src={venue.image_url}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="font-semibold text-white">{venue.name}</h2>
                  {venue.address && (
                    <p className="text-xs text-txt-secondary mt-0.5 truncate">
                      {venue.address}
                    </p>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-txt-secondary">
                  <span className="flex items-center gap-1">
                    <span className="text-gold font-semibold text-sm">
                      {venue.total_capacity.toLocaleString()}
                    </span>{" "}
                    capacity
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-cyan font-semibold text-sm">
                      {sectionCount}
                    </span>{" "}
                    {sectionCount === 1 ? "section" : "sections"}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
                  <Link href={`/admin/venues/${venue.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" fullWidth>
                      Edit
                    </Button>
                  </Link>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      venue.is_active
                        ? "bg-emerald/10 text-emerald"
                        : "bg-white/5 text-txt-secondary"
                    }`}
                  >
                    {venue.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
