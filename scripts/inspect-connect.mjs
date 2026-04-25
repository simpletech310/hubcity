/* eslint-disable no-console */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
  .split("\n").reduce((acc, l) => {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) acc[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    return acc;
  }, {});

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const acct = await stripe.accounts.retrieve(process.argv[2]);
console.log("charges_enabled:", acct.charges_enabled);
console.log("payouts_enabled:", acct.payouts_enabled);
console.log("details_submitted:", acct.details_submitted);
console.log("\nrequirements.currently_due:", acct.requirements?.currently_due);
console.log("requirements.eventually_due:", acct.requirements?.eventually_due);
console.log("requirements.past_due:", acct.requirements?.past_due);
console.log("requirements.disabled_reason:", acct.requirements?.disabled_reason);
console.log("\ncapabilities:", acct.capabilities);
