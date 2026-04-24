/**
 * Culture · Blockprint design system primitives.
 *
 * All screens in the Culture redesign compose these six primitives on top
 * of a parent with the `culture-surface` class + the `c-*` utility classes
 * declared in `src/app/globals.css`. The legacy `src/components/ui/editorial`
 * primitives remain for un-migrated screens.
 */
export { default as CultureMasthead } from "./CultureMasthead";
export { default as CultureMarquee } from "./CultureMarquee";
export { default as CultureSectionHead } from "./CultureSectionHead";
export { default as CultureChipRow } from "./CultureChipRow";
export type { ChipItem } from "./CultureChipRow";
export { default as CultureNumberedRow } from "./CultureNumberedRow";
export { default as CultureBottomNav } from "./CultureBottomNav";
