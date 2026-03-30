-- ═══════════════════════════════════════════════════════
-- Hub City MVP — Event Ticketing System
-- Venues, sections, ticket configs, orders, individual tickets
-- ═══════════════════════════════════════════════════════

-- ─── Venues ───────────────────────────────────────────
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_url TEXT,
  total_capacity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_venues_active ON venues(is_active) WHERE is_active = true;

-- ─── Venue Sections ───────────────────────────────────
CREATE TABLE venue_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  default_price INTEGER NOT NULL,        -- cents
  sort_order INTEGER NOT NULL DEFAULT 0,
  color TEXT,                            -- hex color for display
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_venue_sections_venue ON venue_sections(venue_id, sort_order);

-- ─── Event Ticket Config ──────────────────────────────
-- Per-event, per-section ticket settings
CREATE TABLE event_ticket_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  venue_section_id UUID NOT NULL REFERENCES venue_sections(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,                -- cents (event-specific override)
  capacity INTEGER NOT NULL,
  available_count INTEGER NOT NULL,      -- decremented atomically on purchase
  max_per_order INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, venue_section_id)
);

CREATE INDEX idx_event_ticket_config_event ON event_ticket_config(event_id) WHERE is_active = true;

-- ─── Ticket Orders ────────────────────────────────────
CREATE TABLE ticket_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES events(id),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  subtotal INTEGER NOT NULL,             -- cents
  platform_fee INTEGER NOT NULL,         -- cents
  total INTEGER NOT NULL,                -- cents
  stripe_payment_intent_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_orders_customer ON ticket_orders(customer_id);
CREATE INDEX idx_ticket_orders_event ON ticket_orders(event_id);
CREATE INDEX idx_ticket_orders_stripe ON ticket_orders(stripe_payment_intent_id);

-- ─── Ticket Order Items ───────────────────────────────
CREATE TABLE ticket_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ticket_orders(id) ON DELETE CASCADE,
  event_ticket_config_id UUID NOT NULL REFERENCES event_ticket_config(id),
  section_name TEXT NOT NULL,
  price INTEGER NOT NULL,                -- cents at time of purchase
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_order_items_order ON ticket_order_items(order_id);

-- ─── Individual Tickets ───────────────────────────────
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES ticket_order_items(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES ticket_orders(id),
  event_id UUID NOT NULL REFERENCES events(id),
  ticket_code TEXT NOT NULL UNIQUE,
  holder_name TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_code ON tickets(ticket_code);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_order ON tickets(order_id);

-- ─── ALTER events table ───────────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_ticketed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_sales_start TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_sales_end TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_tickets_per_person INTEGER NOT NULL DEFAULT 10;

-- ─── RPC: Atomic ticket reservation ──────────────────
CREATE OR REPLACE FUNCTION reserve_tickets(
  p_config_id UUID,
  p_quantity INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE event_ticket_config
  SET available_count = available_count - p_quantity,
      updated_at = now()
  WHERE id = p_config_id
    AND available_count >= p_quantity
    AND is_active = true
  RETURNING available_count INTO v_remaining;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN v_remaining;
END;
$$ LANGUAGE plpgsql;

-- ─── RPC: Release tickets (on cancel/refund) ─────────
CREATE OR REPLACE FUNCTION release_tickets(
  p_config_id UUID,
  p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE event_ticket_config
  SET available_count = available_count + p_quantity,
      updated_at = now()
  WHERE id = p_config_id;
END;
$$ LANGUAGE plpgsql;

-- ─── RLS ──────────────────────────────────────────────
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ticket_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Public read for venues/sections/config
CREATE POLICY "Public read venues" ON venues FOR SELECT USING (is_active = true);
CREATE POLICY "Public read venue_sections" ON venue_sections FOR SELECT USING (true);
CREATE POLICY "Public read event_ticket_config" ON event_ticket_config FOR SELECT USING (is_active = true);

-- Admin write for venues/sections/config
CREATE POLICY "Admin manage venues" ON venues FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'city_official')));
CREATE POLICY "Admin manage venue_sections" ON venue_sections FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'city_official')));
CREATE POLICY "Admin manage event_ticket_config" ON event_ticket_config FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'city_official')));

-- Users read own orders/tickets; admin reads all
CREATE POLICY "Users read own ticket_orders" ON ticket_orders FOR SELECT
  USING (auth.uid() = customer_id);
CREATE POLICY "Admin read all ticket_orders" ON ticket_orders FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'city_official')));
CREATE POLICY "Service insert ticket_orders" ON ticket_orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Service update ticket_orders" ON ticket_orders FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'city_official')));

CREATE POLICY "Users read own ticket_order_items" ON ticket_order_items FOR SELECT
  USING (order_id IN (SELECT id FROM ticket_orders WHERE customer_id = auth.uid()));
CREATE POLICY "Admin read all ticket_order_items" ON ticket_order_items FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'city_official')));
CREATE POLICY "Service insert ticket_order_items" ON ticket_order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users read own tickets" ON tickets FOR SELECT
  USING (order_id IN (SELECT id FROM ticket_orders WHERE customer_id = auth.uid()));
CREATE POLICY "Admin manage tickets" ON tickets FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'city_official')));
CREATE POLICY "Service insert tickets" ON tickets FOR INSERT
  WITH CHECK (true);
