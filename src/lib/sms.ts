/**
 * SMS sending — feature-flagged behind `SMS_ENABLED=true`. Until that flag
 * flips, every call is a no-op that just logs. Keeping this tiny surface
 * in place lets booking reminders and confirmations reference
 * `sendSms(...)` today and have it light up the moment Twilio is wired
 * without any caller-side churn.
 *
 * When you're ready to enable Twilio:
 *
 *   1. `npm i twilio`
 *   2. Set env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *      TWILIO_MESSAGING_SERVICE_SID (or TWILIO_FROM_NUMBER), SMS_ENABLED=true
 *   3. Replace the `console.info(...)` branch below with:
 *
 *        const twilio = require("twilio")(
 *          process.env.TWILIO_ACCOUNT_SID,
 *          process.env.TWILIO_AUTH_TOKEN
 *        );
 *        await twilio.messages.create({
 *          to,
 *          body,
 *          messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
 *          // or from: process.env.TWILIO_FROM_NUMBER
 *        });
 *
 *   4. Don't forget: rate-limit per-user, de-dupe on retry, honor STOP.
 */

const SMS_ENABLED = (process.env.SMS_ENABLED || "").toLowerCase() === "true";

export async function sendSms(to: string, body: string): Promise<void> {
  if (!SMS_ENABLED) {
    // No-op in dev / when flag is off. Log to stdout so local testing can
    // see what would have been sent.
    console.info(`[sms:skip] to=${redact(to)} len=${body.length}`);
    return;
  }

  // TODO(twilio): swap this block for the real client once the package is
  // installed and env vars are set. See file header for the exact call.
  console.warn(
    `[sms:enabled-but-unimplemented] Twilio client not wired yet. to=${redact(to)} body=${body.slice(0, 32)}…`
  );
}

function redact(phone: string): string {
  // Log the last 4 digits only so debug output doesn't leak full numbers.
  const digits = phone.replace(/\D+/g, "");
  return digits.length >= 4 ? `***${digits.slice(-4)}` : "***";
}
