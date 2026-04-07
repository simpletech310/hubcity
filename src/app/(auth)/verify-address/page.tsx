"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getDistrictFromZip } from "@/lib/districts";
import Icon from "@/components/ui/Icon";

export default function VerifyAddressPage() {
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const district = getDistrictFromZip(zip);
    if (!district) {
      setError(
        "We couldn't verify your address as a Compton residence. Please check your ZIP code."
      );
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        address_line1: address,
        zip,
        district,
        verification_status: "verified",
      })
      .eq("id", user.id);

    if (updateError) {
      setError("Failed to verify address. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh bg-midnight flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gold-glow flex items-center justify-center mb-6">
        <span className="text-3xl"><Icon name="pin" size={28} /></span>
      </div>

      <h1 className="font-heading text-2xl font-bold mb-2">
        Verify Your Address
      </h1>
      <p className="text-txt-secondary text-sm text-center mb-8">
        Help us connect you with your district and neighborhood resources
      </p>

      <form onSubmit={handleVerify} className="w-full space-y-4">
        <Input
          label="Street Address"
          placeholder="123 Compton Blvd"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="City" value="Compton" disabled />
          <Input
            label="ZIP Code"
            placeholder="90220"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            maxLength={5}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading}>
          Verify & Continue
        </Button>
      </form>

      <button
        onClick={() => router.push("/")}
        className="text-sm text-txt-secondary mt-6 hover:text-white"
      >
        Skip for now
      </button>
    </div>
  );
}
