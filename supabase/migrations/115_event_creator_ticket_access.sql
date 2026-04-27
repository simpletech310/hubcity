-- ═══════════════════════════════════════════════════════
-- Hub City — Let event creators manage tickets/orders for
-- their own ticketed events.
--
-- The original 005_ticketing.sql RLS scoped admin operations
-- to admin / city_official only. That blocks creators (e.g.
-- a verified content_creator like Ayanna Clark) from
-- checking in attendees at their own paint-and-sip events.
-- This migration extends each "Admin" policy with an
-- "or-creator" branch keyed off events.created_by.
-- ═══════════════════════════════════════════════════════

-- ─── event_ticket_config: creator can manage rows on their events ──
DROP POLICY IF EXISTS "Creator manage event_ticket_config" ON event_ticket_config;
CREATE POLICY "Creator manage event_ticket_config" ON event_ticket_config FOR ALL
  USING (
    auth.uid() IN (
      SELECT created_by FROM events WHERE id = event_ticket_config.event_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM events WHERE id = event_ticket_config.event_id
    )
  );

-- ─── ticket_orders: creator reads orders on their events ──
DROP POLICY IF EXISTS "Creator read ticket_orders" ON ticket_orders;
CREATE POLICY "Creator read ticket_orders" ON ticket_orders FOR SELECT
  USING (
    auth.uid() IN (
      SELECT created_by FROM events WHERE id = ticket_orders.event_id
    )
  );

-- ─── ticket_order_items: creator reads items for orders on their events ──
DROP POLICY IF EXISTS "Creator read ticket_order_items" ON ticket_order_items;
CREATE POLICY "Creator read ticket_order_items" ON ticket_order_items FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM ticket_orders o
      JOIN events e ON e.id = o.event_id
      WHERE e.created_by = auth.uid()
    )
  );

-- ─── tickets: creator reads + checks-in tickets on their events ──
DROP POLICY IF EXISTS "Creator manage tickets on own events" ON tickets;
CREATE POLICY "Creator manage tickets on own events" ON tickets FOR ALL
  USING (
    auth.uid() IN (
      SELECT created_by FROM events WHERE id = tickets.event_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM events WHERE id = tickets.event_id
    )
  );

-- ─── venues + venue_sections: creators can read all (already public)
-- and create their own venue / section rows.
DROP POLICY IF EXISTS "Creator manage own venues" ON venues;
CREATE POLICY "Creator manage own venues" ON venues FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- venue_sections has no creator column — gate on the venue's creator.
DROP POLICY IF EXISTS "Creator manage sections on own venues" ON venue_sections;
CREATE POLICY "Creator manage sections on own venues" ON venue_sections FOR ALL
  USING (
    venue_id IN (SELECT id FROM venues WHERE created_by = auth.uid())
  )
  WITH CHECK (
    venue_id IN (SELECT id FROM venues WHERE created_by = auth.uid())
  );
