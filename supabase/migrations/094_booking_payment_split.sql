-- 094_booking_payment_split.sql
-- Track what was charged at booking time (deposit) and what was paid at the
-- appointment (balance). Without this the booking detail page has to guess
-- the deposit by re-reading services.deposit_amount, which is wrong if the
-- service price changes after the booking is created.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS deposit_paid_cents     integer,
  ADD COLUMN IF NOT EXISTS balance_paid_cents     integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_paid_at        timestamptz,
  ADD COLUMN IF NOT EXISTS balance_payment_method text;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_balance_payment_method_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_balance_payment_method_check
  CHECK (balance_payment_method IS NULL OR balance_payment_method IN
    ('platform', 'cash', 'card_at_appointment', 'other'));

COMMENT ON COLUMN public.bookings.deposit_paid_cents IS
  'Amount charged via Stripe at booking creation time (cents). Null if no deposit was taken.';
COMMENT ON COLUMN public.bookings.balance_paid_cents IS
  'Remaining balance paid at the appointment, recorded by the business when checking the customer in.';
COMMENT ON COLUMN public.bookings.balance_paid_at IS
  'Timestamp the business marked the balance paid.';
COMMENT ON COLUMN public.bookings.balance_payment_method IS
  'How the balance was settled at the appointment.';

-- Backfill: every booking that already has a Stripe payment_intent on it
-- represents a successful charge — infer the deposit amount from the
-- matching services row at this moment, falling back to the booking's full
-- price if the service can't be found.
UPDATE public.bookings b
SET deposit_paid_cents = COALESCE(
  (
    SELECT CASE
      WHEN s.deposit_amount IS NOT NULL AND s.deposit_amount > 0 THEN s.deposit_amount
      ELSE s.price
    END
    FROM public.services s
    WHERE s.business_id = b.business_id
      AND s.name = b.service_name
    LIMIT 1
  ),
  b.price
)
WHERE b.stripe_payment_intent_id IS NOT NULL
  AND b.deposit_paid_cents IS NULL;
