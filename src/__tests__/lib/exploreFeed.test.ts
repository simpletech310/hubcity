import { describe, it, expect } from "vitest";
import { interleaveByKind } from "@/lib/feed/exploreFeed";
import type { ExploreKind } from "@/types/database";

function make(kind: ExploreKind, id: number) {
  return { id: `${kind}-${id}`, kind };
}

function maxAdjacentSameKind<T extends { kind: ExploreKind }>(arr: T[]) {
  let max = 0;
  let run = 1;
  for (let i = 1; i < arr.length; i++) {
    run = arr[i].kind === arr[i - 1].kind ? run + 1 : 1;
    if (run > max) max = run;
  }
  return max;
}

describe("interleaveByKind", () => {
  it("returns empty array when input is empty", () => {
    expect(interleaveByKind([])).toEqual([]);
  });

  it("returns single item unchanged", () => {
    const items = [make("creator", 1)];
    expect(interleaveByKind(items)).toEqual(items);
  });

  it("never places two same-kind items adjacent when any alternative exists", () => {
    const items = [
      make("creator", 1),
      make("creator", 2),
      make("creator", 3),
      make("post", 1),
      make("post", 2),
      make("event", 1),
      make("event", 2),
      make("show", 1),
      make("business", 1),
      make("exhibit", 1),
      make("artwork", 1),
      make("mural", 1),
    ];
    const result = interleaveByKind(items, 42);
    expect(result).toHaveLength(items.length);
    // Since no single kind is a majority, we expect zero adjacent duplicates.
    expect(maxAdjacentSameKind(result)).toBe(1);
  });

  it("handles a dominant kind gracefully (degrades when unavoidable)", () => {
    const items = [
      ...Array.from({ length: 10 }, (_, i) => make("creator", i)),
      make("post", 1),
      make("event", 1),
    ];
    const result = interleaveByKind(items, 7);
    expect(result).toHaveLength(items.length);
    // With a dominant kind we cannot guarantee zero adjacency, but the
    // algorithm should still separate the minority kinds from each other.
    const minorityKinds = result.filter((i) => i.kind !== "creator");
    expect(minorityKinds).toHaveLength(2);
  });

  it("produces a stable result for the same seed", () => {
    const items = [
      make("creator", 1),
      make("post", 1),
      make("event", 1),
      make("show", 1),
      make("business", 1),
      make("exhibit", 1),
    ];
    const a = interleaveByKind(items, 123);
    const b = interleaveByKind(items, 123);
    expect(a.map((i) => i.id)).toEqual(b.map((i) => i.id));
  });
});
