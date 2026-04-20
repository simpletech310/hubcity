"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ImageGallery from "@/components/uploads/ImageGallery";
import { createClient } from "@/lib/supabase/client";

const STORY_MAX = 1500;

export default function BusinessProfileEditor({
  businessId,
  initialImages,
  initialStory,
}: {
  businessId: string;
  initialImages: string[];
  initialStory: string;
}) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [story, setStory] = useState<string>(initialStory);
  const [savingImages, setSavingImages] = useState(false);
  const [savingStory, setSavingStory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<"images" | "story" | null>(null);

  function flashSaved(which: "images" | "story") {
    setSavedField(which);
    setTimeout(() => setSavedField(null), 1800);
  }

  async function persistImages(next: string[]) {
    setImages(next);
    setSavingImages(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase
        .from("businesses")
        .update({ image_urls: next })
        .eq("id", businessId);
      if (updateErr) throw updateErr;
      flashSaved("images");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save images");
    } finally {
      setSavingImages(false);
    }
  }

  async function saveStory() {
    setSavingStory(true);
    setError(null);
    try {
      const supabase = createClient();
      const trimmed = story.trim();
      const { error: updateErr } = await supabase
        .from("businesses")
        .update({ story: trimmed || null })
        .eq("id", businessId);
      if (updateErr) throw updateErr;
      flashSaved("story");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save story");
    } finally {
      setSavingStory(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
          Photo Gallery
        </h3>
        <ImageGallery
          urls={images}
          onChange={persistImages}
          uploadEndpoint="/api/uploads/business-image"
          label="Hero & gallery photos"
          helperText="The first photo is your hero image. Drag to reorder."
          maxImages={10}
        />
        <div className="flex items-center justify-between mt-3 min-h-[18px]">
          {savingImages && (
            <span className="text-[11px] text-txt-secondary">Saving…</span>
          )}
          {!savingImages && savedField === "images" && (
            <span className="text-[11px] text-emerald">Saved</span>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
          Our Story
        </h3>
        <p className="text-[11px] text-txt-secondary mb-2">
          A longer narrative shown on your public page. Use this to share your
          history, mission, or what makes your business unique.
        </p>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value.slice(0, STORY_MAX))}
          rows={6}
          placeholder="Founded in 2018, we set out to..."
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 resize-none transition-colors"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-txt-secondary">
            {story.length} / {STORY_MAX}
          </span>
          <div className="flex items-center gap-3">
            {savedField === "story" && !savingStory && (
              <span className="text-[11px] text-emerald">Saved</span>
            )}
            <Button
              type="button"
              size="sm"
              loading={savingStory}
              onClick={saveStory}
            >
              Save story
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card>
          <p className="text-sm text-coral">{error}</p>
        </Card>
      )}
    </div>
  );
}
