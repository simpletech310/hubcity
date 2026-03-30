import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobApplicationForm from "@/components/jobs/JobApplicationForm";
import type { JobListing } from "@/types/database";

export default async function JobApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/jobs/${id}/apply`);
  }

  // Try slug first, then id
  let { data: job } = await supabase
    .from("job_listings")
    .select("*")
    .eq("slug", id)
    .eq("is_active", true)
    .single();

  if (!job) {
    const { data } = await supabase
      .from("job_listings")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();
    job = data;
  }

  if (!job) notFound();

  return <JobApplicationForm job={job as JobListing} />;
}
