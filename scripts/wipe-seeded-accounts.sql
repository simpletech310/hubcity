-- Wipe seeded creator/official/test accounts.
--
-- Preserves: role IN ('business_owner','admin'), any profile referenced by
-- businesses.owner_id, and profiles whose auth user email is in the
-- preserve list.
--
-- Run via:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f wipe-seeded-accounts.sql

begin;

-- 1. Compute victim IDs into a TEMP table so every subsequent DELETE is
-- cheap and consistent within the transaction.
create temp table _victims as
  select p.id
  from profiles p
  left join auth.users u on u.id = p.id
  where p.role not in ('business_owner','admin')
    and p.id not in (select owner_id from businesses where owner_id is not null)
    and coalesce(lower(u.email), '') <> 'commonground.notify@gmail.com';

select 'Victim count' as label, count(*) from _victims;

-- 2. Delete from every FK-referring table. Ordered so children go before
-- parents where a parent is also a child of profiles. Best-effort: each
-- DELETE is guarded with `to regclass` so tables that don't exist in a
-- given environment don't abort the transaction.

do $$
declare
  stmt text;
  t record;
begin
  for t in
    select unnest(array[
      'ad_campaigns:advertiser_id',
      'ad_impressions:user_id',
      'address_verifications:reviewer_id',
      'address_verifications:user_id',
      'audit_log:actor_id',
      'booking_audit_log:actor_id',
      'bookings:customer_id',
      'broadcast_log:sent_by',
      'business_customers:customer_id',
      'business_reviews:reviewer_id',
      'business_staff:user_id',
      'channel_follows:user_id',
      'channel_subscriptions:user_id',
      'citizen_badges:user_id',
      'city_alerts:created_by',
      'city_issue_comments:author_id',
      'city_issue_upvotes:user_id',
      'city_issues:reported_by',
      'city_issues:resolved_by',
      'civic_officials:profile_id',
      'comment_likes:user_id',
      'comments:author_id',
      'community_groups:created_by',
      'content_audit_log:actor_id',
      'content_reports:reporter_id',
      'content_reports:reviewed_by',
      'content_shares:shared_by',
      'content_views:user_id',
      'council_messages:council_member_id',
      'council_messages:sender_id',
      'couriers:user_id',
      'creator_applications:reviewed_by',
      'creator_applications:user_id',
      'creator_earnings:creator_id',
      'creator_stripe_accounts:creator_id',
      'culture_events:created_by',
      'delivery_audit_log:actor_id',
      'district_engagement:user_id',
      'district_post_comments:author_id',
      'district_post_reactions:user_id',
      'district_posts:author_id',
      'district_programs:created_by',
      'event_rsvps:user_id',
      'events:created_by',
      'food_challenges:created_by',
      'food_tours:created_by',
      'gallery_items:artist_id',
      'gallery_items:created_by',
      'grant_applications:applicant_id',
      'grant_applications:reviewed_by',
      'group_members:user_id',
      'group_post_comment_likes:user_id',
      'group_post_comments:author_id',
      'group_post_reactions:user_id',
      'group_posts:author_id',
      'job_alerts:user_id',
      'job_applications:applicant_id',
      'job_listings:posted_by',
      'job_messages:sender_id',
      'library_items:created_by',
      'live_streams:created_by',
      'messages:recipient_id',
      'messages:sender_id',
      'murals:artist_id',
      'museum_exhibits:created_by',
      'notable_people:created_by',
      'notification_broadcasts:sent_by',
      'notifications:user_id',
      'order_audit_log:actor_id',
      'orders:customer_id',
      'organization_members:user_id',
      'payment_intents:user_id',
      'poll_votes:user_id',
      'polls:author_id',
      'post_bookmarks:user_id',
      'post_likes:user_id',
      'post_reactions:user_id',
      'posts:author_id',
      'profile_gallery_images:owner_id',
      'reel_reactions:user_id',
      'reel_views:user_id',
      'reels:author_id',
      'resources:created_by',
      'saved_items:user_id',
      'saved_jobs:user_id',
      'school_admins:user_id',
      'search_queries:user_id',
      'show_submissions:reviewer_id',
      'show_submissions:submitter_id',
      'shows:creator_id',
      'stripe_webhook_failures:resolved_by',
      'survey_responses:respondent_id',
      'surveys:author_id',
      'trustee_area_post_comments:author_id',
      'trustee_area_post_reactions:user_id',
      'trustee_area_posts:author_id',
      'trustee_area_programs:created_by',
      'trustee_messages:receiver_id',
      'trustee_messages:sender_id',
      'user_achievements:user_id',
      'user_cities:user_id',
      'user_interests:user_id',
      'video_purchases:user_id'
    ]) as spec
  loop
    declare
      parts text[] := string_to_array(t.spec, ':');
      tbl   text := parts[1];
      col   text := parts[2];
      regcl regclass;
    begin
      regcl := to_regclass('public.' || tbl);
      if regcl is null then
        continue;
      end if;
      stmt := format('delete from public.%I where %I in (select id from _victims)', tbl, col);
      execute stmt;
    exception when undefined_column then
      -- column doesn't exist in this env, skip
      null;
    end;
  end loop;
end
$$;

-- 3. Channel-scoped cascades: live_streams / scheduled_broadcasts /
-- time_blocks / channel_videos reference channels, not profiles directly.
do $$
declare
  ch_ids uuid[];
begin
  select array_agg(id) into ch_ids from public.channels where owner_id in (select id from _victims);
  if ch_ids is null or array_length(ch_ids, 1) is null then
    return;
  end if;
  delete from public.channel_videos where channel_id = any(ch_ids);
  delete from public.live_streams where channel_id = any(ch_ids);
  if to_regclass('public.scheduled_broadcasts') is not null then
    delete from public.scheduled_broadcasts where channel_id = any(ch_ids);
  end if;
  if to_regclass('public.time_blocks') is not null then
    delete from public.time_blocks where channel_id = any(ch_ids);
  end if;
  delete from public.channel_subscriptions where channel_id = any(ch_ids);
  delete from public.channels where id = any(ch_ids);
end
$$;

-- 4. Finally the profiles themselves.
delete from public.profiles where id in (select id from _victims);

-- 5. Drop matching auth.users so emails can be reused.
delete from auth.users where id in (select id from _victims);

select 'Remaining profiles' as label, count(*) from profiles;

commit;
