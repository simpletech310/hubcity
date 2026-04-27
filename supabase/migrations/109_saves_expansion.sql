-- ============================================================
-- Hub City App — Expand saved_items to cover music + groups + creators
-- ============================================================
-- The original CHECK constraint (migration 001) limited item_type to
-- 'business', 'event', 'resource'. Now that the platform has albums,
-- tracks, community groups, and a creator directory, citizens want a
-- single shelf at /profile/saved to bookmark all of it.
-- ============================================================

ALTER TABLE saved_items
  DROP CONSTRAINT IF EXISTS saved_items_item_type_check;

ALTER TABLE saved_items
  ADD CONSTRAINT saved_items_item_type_check
  CHECK (item_type IN (
    'business',
    'event',
    'resource',
    'album',
    'track',
    'group',
    'creator'
  ));
