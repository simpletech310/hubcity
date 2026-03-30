import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type { Resource } from "@/types/database";

export default async function AdminResourcesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  const resources = (data as Resource[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Resources</h1>
          <p className="text-sm text-txt-secondary">
            {resources.length} grants, programs & services
          </p>
        </div>
        <Link href="/admin/resources/new"><Button>+ Add Resource</Button></Link>
      </div>

      <div className="space-y-2">
        {resources.map((resource) => (
          <Card key={resource.id} hover>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-sm font-semibold mb-1">{resource.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge label={resource.category} variant="purple" />
                  <Badge
                    label={resource.status}
                    variant={resource.status === "open" ? "emerald" : resource.status === "closed" ? "coral" : "gold"}
                  />
                  {resource.is_free && <Badge label="Free" variant="emerald" />}
                  {resource.organization && (
                    <span className="text-xs text-txt-secondary">{resource.organization}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  label={resource.is_published ? "Published" : "Draft"}
                  variant={resource.is_published ? "emerald" : "gold"}
                />
                <Link href={`/admin/resources/${resource.id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
