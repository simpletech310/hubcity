// ─────────────────────────────────────────────────────────
// HubCity Icon System — Centralized SVG icon component
// Replaces all emoji usage with cohesive stroke icons
// ─────────────────────────────────────────────────────────

import React from "react";

export type IconName =
  // Navigation
  | "home" | "pulse" | "services" | "live" | "profile"
  | "back" | "forward" | "close" | "menu" | "search" | "filter"
  | "chevron-right" | "chevron-down" | "chevron-up"
  // Jobs
  | "briefcase" | "building" | "clock" | "handshake" | "document"
  | "palm" | "graduation" | "dollar" | "wallet"
  // Food
  | "utensils" | "truck" | "cart" | "flame" | "moon" | "bolt"
  | "family" | "fish" | "meat" | "taco" | "burger" | "wings" | "bowl"
  | "pizza" | "donut" | "coffee" | "ice-cream" | "shrimp" | "noodles"
  // Culture
  | "museum" | "palette" | "frame" | "person" | "scroll" | "film"
  | "book" | "chat" | "theater" | "calendar" | "music" | "trophy"
  | "megaphone" | "mic" | "camera" | "archive"
  // Business
  | "store" | "scissors" | "shopping" | "wrench" | "car"
  | "heart-pulse" | "sparkle" | "tag" | "crown" | "gem"
  // Civic
  | "landmark" | "shield" | "transit" | "gavel" | "flag"
  | "bell" | "chart" | "users" | "globe" | "vote" | "megaphone-alt"
  // Resources
  | "house" | "apple" | "baby" | "elder" | "veteran" | "education"
  | "lightbulb" | "phone" | "mail" | "first-aid" | "pill" | "tooth"
  | "brain" | "stethoscope"
  // Status
  | "check" | "warning" | "alert" | "info" | "star" | "pin"
  | "external" | "share" | "bookmark" | "download" | "upload"
  | "verified" | "trending" | "live-dot"
  // Actions
  | "edit" | "trash" | "plus" | "minus" | "settings" | "eye"
  | "lock" | "unlock" | "send" | "refresh" | "copy" | "link"
  // Parks & Amenities
  | "playground" | "basketball" | "tennis" | "soccer" | "swimming"
  | "skateboard" | "bbq" | "restroom" | "tree" | "parking"
  // Weather
  | "sun" | "cloud" | "rain" | "snow" | "wind" | "thermometer"
  // Misc
  | "grid" | "list" | "map-pin" | "navigation" | "ticket"
  | "receipt" | "credit-card" | "qr-code" | "photo"
  | "video" | "headphones" | "podcast" | "radio";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

// SVG path data for each icon
const iconPaths: Record<IconName, string> = {
  // ── Navigation ──
  home: "M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M7 18v-5h6v5",
  pulse: "M2 10h3l2-6 3 12 2-6h3 M15 10h3",
  services: "M4 4h5v5H4z M11 4h5v5h-5z M4 11h5v5H4z M11 11h5v5h-5z",
  live: "M2 8a8.5 8.5 0 0116 0 M5 11a4.5 4.5 0 019 0 M10 14v0",
  profile: "M10 11a4 4 0 100-8 4 4 0 000 8z M3 18c0-3 3.5-5 7-5s7 2 7 5",
  back: "M12 16l-5-5 5-5",
  forward: "M8 4l5 5-5 5",
  close: "M5 5l10 10 M15 5L5 15",
  menu: "M3 6h14 M3 10h14 M3 14h14",
  search: "M8.5 3a5.5 5.5 0 110 11 5.5 5.5 0 010-11z M13 13l4 4",
  filter: "M2 3h16 M4 8h12 M7 13h6",
  "chevron-right": "M7 4l6 6-6 6",
  "chevron-down": "M4 7l6 6 6-6",
  "chevron-up": "M4 13l6-6 6 6",

  // ── Jobs ──
  briefcase: "M4 7h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z M7 7V5a2 2 0 012-2h2a2 2 0 012 2v2",
  building: "M3 18V6a1 1 0 011-1h5v13 M9 18V9h5a1 1 0 011 1v8 M6 8h1 M6 11h1 M6 14h1 M12 12h1 M12 15h1",
  clock: "M10 3a7 7 0 110 14 7 7 0 010-14z M10 6v4l3 2",
  handshake: "M2 11l3-3h3l2 2 2-2h3l3 3 M5 14l2 2 M13 14l2 2 M7 16l3 2 3-2",
  document: "M5 2h7l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z M12 2v4h4 M7 9h6 M7 12h6 M7 15h4",
  palm: "M10 18V8 M7 10c-3-2-5 0-5 3 M13 10c3-2 5 0 5 3 M10 8c0-3-2-6-4-4 M10 8c0-3 2-6 4-4",
  graduation: "M1 8l9-4 9 4-9 4z M5 10v5l5 3 5-3v-5",
  dollar: "M10 2v16 M13 5H8.5a2.5 2.5 0 000 5h3a2.5 2.5 0 010 5H7",
  wallet: "M3 6h14a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z M14 11h2 M5 4l10 2",

  // ── Food ──
  utensils: "M6 2v6a2 2 0 004 0V2 M8 8v10 M14 2v16 M14 2c2 0 3 2 3 4s-1 3-3 4",
  truck: "M2 11h11V5H2z M13 14h3l2-3v3 M5 16a2 2 0 100-4 2 2 0 000 4z M16 16a2 2 0 100-4 2 2 0 000 4z",
  cart: "M2 2h2l2 9h9l2-6H6 M8 17a1 1 0 100-2 1 1 0 000 2z M15 17a1 1 0 100-2 1 1 0 000 2z",
  flame: "M10 2c0 4-6 6-6 10a6 6 0 0012 0c0-4-6-6-6-10z M10 18c-1.5 0-3-1-3-3 0-2 3-3 3-6 0 3 3 4 3 6 0 2-1.5 3-3 3z",
  moon: "M16 10A6 6 0 014 10a8 8 0 1012 0z",
  bolt: "M11 2L5 12h5l-1 6 6-10H10l1-6z",
  family: "M7 7a2 2 0 100-4 2 2 0 000 4z M13 7a2 2 0 100-4 2 2 0 000 4z M4 18v-4a3 3 0 016 0v4 M10 18v-4a3 3 0 016 0v4",
  fish: "M3 10c3-4 8-5 13-2-5 3-10 2-13 2z M16 8l2-2 M16 12l2 2 M8 10v0",
  meat: "M12 4a5 5 0 010 10L8 18 2 12l4-4a5 5 0 010-4z M6 14l2-2",
  taco: "M3 12c0 4 3 6 7 6s7-2 7-6 M3 12C3 8 6 4 10 4s7 4 7 8 M6 10c1-2 2.5-3 4-3s3 1 4 3",
  burger: "M3 8h14a1 1 0 010 2H3a1 1 0 010-2z M4 10v2c0 2 2.5 3 6 3s6-1 6-3v-2 M4 8V7c0-2.5 2.5-4 6-4s6 1.5 6 4v1",
  wings: "M2 10c2-4 5-5 8-3 3-2 6-1 8 3 M4 13c1.5-2 3-3 6-2 3-1 4.5 0 6 2 M7 16c1-1 2-1.5 3-1s2 0 3 1",
  bowl: "M2 8h16 M3 8c0 5 3 8 7 8s7-3 7-8 M10 16v2 M6 18h8",
  pizza: "M10 2L2 17h16z M10 2v9 M6 11l8-2",
  donut: "M10 3a7 7 0 110 14 7 7 0 010-14z M10 7a3 3 0 110 6 3 3 0 010-6z",
  coffee: "M3 6h10v7a3 3 0 01-3 3H6a3 3 0 01-3-3V6z M13 8h2a2 2 0 010 4h-2 M3 18h10",
  "ice-cream": "M10 18l-4-8h8z M6 10a4 4 0 018 0",
  shrimp: "M15 5c0 3-2 5-5 5H6 M15 5c0-2-1-3-3-3S9 3 9 5c0 3 3 5 6 5 M6 10c-2 0-3 1-3 3s2 4 4 4 M4 17l3 1",
  noodles: "M3 12h14 M5 12c0-4 0-8 2-8s2 4 2 8 M9 12c0-4 0-8 2-8s2 4 2 8 M13 12c0-4 0-8 2-8 M3 12c0 4 2 6 7 6s7-2 7-6",

  // ── Culture ──
  museum: "M2 17h16 M10 3l8 5H2z M4 8v9 M8 8v9 M12 8v9 M16 8v9",
  palette: "M10 2a8 8 0 100 16c1 0 2-1 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.7-.5-1.2 0-1 .8-1.5 1.5-1.5H14a4 4 0 004-4c0-4.4-3.6-8-8-8z M6 10v0 M8 7v0 M12 7v0 M14 10v0",
  frame: "M3 3h14v14H3z M6 6h8v8H6z",
  person: "M10 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M3 18c0-3.5 3-6 7-6s7 2.5 7 6",
  scroll: "M5 3h10a2 2 0 012 2v10a2 2 0 01-2 2H5 M5 3a2 2 0 00-2 2v10a2 2 0 002 2 M8 8h4 M8 12h4",
  film: "M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z M7 4v12 M13 4v12 M2 8h5 M13 8h5 M2 12h5 M13 12h5",
  book: "M4 2h12a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1 M4 2a2 2 0 00-2 2v12a2 2 0 002 2h13 M8 6h4 M8 10h2",
  chat: "M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1h-4l-3 3-3-3H3a1 1 0 01-1-1V5a1 1 0 011-1z",
  theater: "M3 4h14v8c0 3-3 5-7 5s-7-2-7-5z M7 2v2 M13 2v2 M7 9c0 1 1.5 2 3 2s3-1 3-2",
  calendar: "M3 5h14a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1z M14 3v4 M6 3v4 M2 9h16 M6 13h2 M10 13h2",
  music: "M7 17V5l9-2v12 M7 17a2 2 0 11-4 0 2 2 0 014 0z M16 15a2 2 0 11-4 0 2 2 0 014 0z",
  trophy: "M5 3h10v4a5 5 0 01-10 0V3z M10 12v3 M7 18h6 M2 3h3 M15 3h3 M2 3v3a3 3 0 003 3 M18 3v3a3 3 0 01-3 3",
  megaphone: "M3 9h2l8-4v10l-8-4H3z M13 9c1 0 2 .5 2 1.5S14 12 13 12 M16 7c2 0 3 1.5 3 3.5S18 14 16 14",
  mic: "M10 2a3 3 0 00-3 3v4a3 3 0 006 0V5a3 3 0 00-3-3z M4 9a6 6 0 0012 0 M10 15v3 M7 18h6",
  camera: "M3 7h2l1-2h8l1 2h2a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z M10 14a3 3 0 110-6 3 3 0 010 6z",
  archive: "M3 3h14v4H3z M5 7v9a1 1 0 001 1h8a1 1 0 001-1V7 M8 11h4",

  // ── Business ──
  store: "M3 10V6h14v4 M3 10c0 1.5 1 2.5 2.3 2.5S7.7 11.5 7.7 10c0 1.5 1 2.5 2.3 2.5s2.3-1 2.3-2.5c0 1.5 1 2.5 2.3 2.5S17 11.5 17 10 M3 12v5a1 1 0 001 1h12a1 1 0 001-1v-5",
  scissors: "M6 3a3 3 0 110 6 3 3 0 010-6z M6 17a3 3 0 100-6 3 3 0 000 6z M8.5 7.5L16 3 M8.5 12.5L16 17",
  shopping: "M4 2l-1 5h14l-1-5 M3 7h14v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z M8 10v3 M12 10v3",
  wrench: "M14 4l-4 4 2 2 4-4a3.5 3.5 0 01-2 5l-7 7a2 2 0 01-3-3l7-7a3.5 3.5 0 015-2z",
  car: "M4 12l1.5-5A2 2 0 017.4 5h5.2a2 2 0 011.9 1.3L16 12 M3 12h14a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3a1 1 0 011-1z M5.5 15h1 M13.5 15h1",
  "heart-pulse": "M10 5.5C7.5 2 2 3 2 7.5c0 5 8 9.5 8 9.5s8-4.5 8-9.5c0-4.5-5.5-5.5-8-2z M2 10h4l1.5-3 2 6 1.5-3H15",
  sparkle: "M10 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2z",
  tag: "M2 7.5V3a1 1 0 011-1h4.5L17 11.5 11.5 17z M6 6v0",
  crown: "M3 14l2-8 3 3 2-5 2 5 3-3 2 8z M3 14h14v2H3z",
  gem: "M3 8l7-5 7 5-7 10z M2 8h16 M10 3v15 M5.5 8L10 18l4.5-10",

  // ── Civic ──
  landmark: "M2 17h16 M4 17v-5h2v5 M9 17V9h2v8 M14 17v-5h2v5 M2 12h16 M10 4l8 5H2z",
  shield: "M10 2l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5z",
  transit: "M5 3h10a2 2 0 012 2v7a4 4 0 01-4 4H7a4 4 0 01-4-4V5a2 2 0 012-2z M5 10h10 M7 14h0 M13 14h0 M7 18l-2 2 M13 18l2 2 M5 3h10",
  gavel: "M11 4l4 4-8 8-4-4z M15 8l2 2 M3 16l2 2 M2 18h8",
  flag: "M4 2v16 M4 2c3 0 5 2 8 2s5-2 5-2v8c-2 0-2 2-5 2s-5-2-8-2",
  bell: "M10 2a6 6 0 016 6v3l2 2H2l2-2V8a6 6 0 016-6z M8 17a2 2 0 004 0",
  chart: "M3 18V9l4-5 4 7 4-3 2 4V18 M3 18h14",
  users: "M7 10a3 3 0 100-6 3 3 0 000 6z M1 18c0-3 2.5-5 6-5s6 2 6 5 M14 6a3 3 0 110 6 M16 18c2-.5 3-2 3-4.5 0-2-1.5-3.5-3-4",
  globe: "M10 2a8 8 0 110 16 8 8 0 010-16z M2 10h16 M10 2c2.5 2.5 4 5.2 4 8s-1.5 5.5-4 8c-2.5-2.5-4-5.2-4-8s1.5-5.5 4-8z",
  vote: "M3 14h14v4H3z M5 14V8l5-4 5 4v6 M10 8v6 M7 10h6",
  "megaphone-alt": "M4 8h2l9-5v14l-9-5H4a1 1 0 01-1-1V9a1 1 0 011-1z M15 8c2 0 3 1 3 2s-1 2-3 2",

  // ── Resources ──
  house: "M3 10l7-7 7 7v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z M7 18v-5h6v5",
  apple: "M10 2c2-1 4 0 4 0 M7 6c-3 0-5 3-5 7 0 3 2 5 5 5 1 0 2-.5 3-.5s2 .5 3 .5c3 0 5-2 5-5 0-4-2-7-5-7-1 0-2 .5-3 .5S8 6 7 6z",
  baby: "M10 8a3 3 0 100-6 3 3 0 000 6z M6 18v-3a4 4 0 018 0v3 M4 11h2 M14 11h2",
  elder: "M10 6a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M8 18l-2-8 3 1h2l3-1-2 8 M12 9v3 M15 15l3 3",
  veteran: "M10 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z",
  education: "M1 8l9-4 9 4-9 4z M5 10v5l5 3 5-3v-5",
  lightbulb: "M10 2a5 5 0 013 9v2H7v-2a5 5 0 013-9z M7 15h6 M8 18h4",
  phone: "M4 2h3l2 5-3 2a11 11 0 005 5l2-3 5 2v3a1 1 0 01-1 1C8 17 2 11 2 3a1 1 0 011-1z",
  mail: "M2 4h16v12H2z M2 4l8 6 8-6",
  "first-aid": "M3 5h14v10H3z M10 8v4 M8 10h4",
  pill: "M5.5 14.5l5-5a3 3 0 114.2 4.2l-5 5a3 3 0 01-4.2-4.2z M8.5 11.5l3 3",
  tooth: "M7 2c-2 0-4 2-4 5 0 2 .5 3 1 5l1.5 4c.5 1.5 1 2 2 2s1.5-.5 2.5-2c1 1.5 1.5 2 2.5 2s1.5-.5 2-2L16 12c.5-2 1-3 1-5 0-3-2-5-4-5-1 0-1.5.5-3 .5S9 2 7 2z",
  brain: "M10 18V8 M10 8c0-3-1.5-5-4-5S2 5 2 8c0 2 1 4 3 5 M10 8c0-3 1.5-5 4-5s4 2 4 5c0 2-1 4-3 5 M5 13c-1 1-1.5 3-1 5h6 M15 13c1 1 1.5 3 1 5h-6",
  stethoscope: "M6 10V5a4 4 0 018 0v5 M6 10a3 3 0 106 0 M14 10v1a4 4 0 01-8 0 M15 14a2 2 0 100-4 2 2 0 000 4z",

  // ── Status ──
  check: "M4 10l4 4 8-8",
  warning: "M10 2l8 14H2z M10 7v4 M10 14v0",
  alert: "M10 3a7 7 0 110 14 7 7 0 010-14z M10 7v4 M10 14v0",
  info: "M10 3a7 7 0 110 14 7 7 0 010-14z M10 9v5 M10 7v0",
  star: "M10 2l2.5 5 5.5.8-4 3.8 1 5.4L10 14.5 5 17l1-5.4L2 7.8l5.5-.8z",
  pin: "M10 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M10 18l-5-5.5a5 5 0 1110 0z",
  external: "M8 3H3v14h14v-5 M12 3h5v5 M17 3L9 11",
  share: "M15 7a3 3 0 110-6 3 3 0 010 6z M5 13a3 3 0 110-6 3 3 0 010 6z M15 19a3 3 0 110-6 3 3 0 010 6z M7.5 11l5-3 M7.5 9l5 3",
  bookmark: "M4 2h12v16l-6-4-6 4z",
  download: "M10 2v12 M6 10l4 4 4-4 M3 16v1a1 1 0 001 1h12a1 1 0 001-1v-1",
  upload: "M10 14V2 M6 6l4-4 4 4 M3 16v1a1 1 0 001 1h12a1 1 0 001-1v-1",
  verified: "M10 2l2 2.5H15l.5 3L18 10l-2.5 2.5-.5 3H12l-2 2.5-2-2.5H5l-.5-3L2 10l2.5-2.5.5-3H8z M7 10l2 2 4-4",
  trending: "M2 14l4-4 3 3 6-7 M15 6h3v3",
  "live-dot": "M10 10a2 2 0 110-4 2 2 0 010 4z M10 2a6 6 0 110 12 6 6 0 010-12z",

  // ── Actions ──
  edit: "M12 3l4 4-9 9H3v-4z M11 4l4 4",
  trash: "M3 5h14 M6 5V3h8v2 M5 5v11a2 2 0 002 2h6a2 2 0 002-2V5 M8 8v6 M12 8v6",
  plus: "M10 4v12 M4 10h12",
  minus: "M4 10h12",
  settings: "M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M16.5 10a6.5 6.5 0 00-.5-2l2-2-2-2-2 2a6.5 6.5 0 00-2-.5V3H8v2.5a6.5 6.5 0 00-2 .5L4 4 2 6l2 2a6.5 6.5 0 00-.5 2H1v4h2.5a6.5 6.5 0 00.5 2l-2 2 2 2 2-2a6.5 6.5 0 002 .5V19h4v-2.5a6.5 6.5 0 002-.5l2 2 2-2-2-2a6.5 6.5 0 00.5-2H19v-4z",
  eye: "M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  lock: "M5 10V7a5 5 0 0110 0v3 M4 10h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6a1 1 0 011-1z",
  unlock: "M5 10V7a5 5 0 0110 0 M4 10h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6a1 1 0 011-1z",
  send: "M2 10l16-8-4 16-4-8z M18 2L10 10",
  refresh: "M2 10a8 8 0 0114-5 M18 10a8 8 0 01-14 5 M2 4v6h6 M18 16v-6h-6",
  copy: "M6 6H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1v-2 M8 3h8a1 1 0 011 1v10a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1z",
  link: "M8 12l4-4 M7 9L5 11a3 3 0 004.2 4.2l2-2 M13 11l2-2a3 3 0 00-4.2-4.2l-2 2",

  // ── Parks & Amenities ──
  playground: "M10 6a2 2 0 100-4 2 2 0 000 4z M6 18l4-8 4 8 M3 14h4 M13 14h4 M5 18h10",
  basketball: "M10 2a8 8 0 110 16 8 8 0 010-16z M2 10h16 M10 2v16 M4.5 4.5c3 2 5 5 5 5.5 M15.5 4.5c-3 2-5 5-5 5.5",
  tennis: "M10 2a8 8 0 110 16 8 8 0 010-16z M3 5c4 3 7 7 14 10 M3 15c4-3 7-7 14-10",
  soccer: "M10 2a8 8 0 110 16 8 8 0 010-16z M10 6l3 2v4l-3 2-3-2V8z",
  swimming: "M2 14c2 0 3-1 4-1s2 1 4 1 3-1 4-1 2 1 4 1 M2 17c2 0 3-1 4-1s2 1 4 1 3-1 4-1 2 1 4 1 M7 7a2 2 0 100-4 2 2 0 000 4z M4 11l3-3 4 3 3-3",
  skateboard: "M3 12h14 M5 10v2 M15 10v2 M5 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M15 14a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  bbq: "M10 12v6 M6 18h8 M4 8h12 M6 4c0 2 1 3 1 4 M10 4c0 2 1 3 1 4 M14 4c0 2 1 3 1 4 M3 8c0 2 3 4 7 4s7-2 7-4",
  restroom: "M6 4a2 2 0 100-4 2 2 0 000 4z M14 4a2 2 0 100-4 2 2 0 000 4z M4 6h4l-1 6H4l2 6 M3 12h5 M12 6h4l1 12 M12 6l-1 12",
  tree: "M10 18v-4 M4 14l6-10 6 10z M6 12l4-6 4 6",
  parking: "M4 2h12v16H4z M8 6h2.5a2.5 2.5 0 010 5H8z M8 6v12",

  // ── Weather ──
  sun: "M10 13a3 3 0 100-6 3 3 0 000 6z M10 1v2 M10 17v2 M3.5 3.5l1.5 1.5 M15 15l1.5 1.5 M1 10h2 M17 10h2 M3.5 16.5l1.5-1.5 M15 5l1.5-1.5",
  cloud: "M6 16a4 4 0 01-.5-7.97A6 6 0 0117 10h1a3 3 0 010 6z",
  rain: "M6 14a4 4 0 01-.5-7.97A6 6 0 0117 8h1a3 3 0 010 6 M7 16l-1 3 M11 16l-1 3 M15 16l-1 3",
  snow: "M6 14a4 4 0 01-.5-7.97A6 6 0 0117 8h1a3 3 0 010 6 M8 17v0 M12 17v0 M10 19v0",
  wind: "M3 8h10a2 2 0 100-4 M3 12h12a2 2 0 110 4 M3 16h6a2 2 0 100-4",
  thermometer: "M10 14a3 3 0 110 0V4a2 2 0 10-4 0v10z M10 14V8",

  // ── Misc ──
  grid: "M3 3h5v5H3z M12 3h5v5h-5z M3 12h5v5H3z M12 12h5v5h-5z",
  list: "M3 4h14 M3 8h14 M3 12h14 M3 16h14",
  "map-pin": "M10 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M10 18l-5-5.5a5 5 0 1110 0z",
  navigation: "M3 10l14-8-8 14V10z",
  ticket: "M3 6h14v3a2 2 0 100 4v3H3v-3a2 2 0 100-4z M9 6v12",
  receipt: "M4 2h12v16l-2-1.5L12 18l-2-1.5L8 18l-2-1.5L4 18z M7 6h6 M7 9h6 M7 12h4",
  "credit-card": "M2 5h16v10H2z M2 9h16 M5 13h3 M12 13h1",
  "qr-code": "M3 3h5v5H3z M12 3h5v5h-5z M3 12h5v5H3z M12 12h2v2h-2z M16 12v5h-2 M16 14h2v4 M12 16h1",
  photo: "M3 3h14a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z M7 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M18 13l-4-4-8 8",
  video: "M2 5h11v10H2z M13 8l5-3v10l-5-3z",
  headphones: "M3 13v-3a7 7 0 0114 0v3 M3 13a2 2 0 00-2 2v1a2 2 0 002 2 M17 13a2 2 0 012 2v1a2 2 0 01-2 2 M3 18V13 M17 18V13",
  podcast: "M10 12a2 2 0 100-4 2 2 0 000 4z M10 12v6 M6 8a5 5 0 018 0 M4 6a7 7 0 0112 0",
  radio: "M3 7h14a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z M13 12a2 2 0 100-4 2 2 0 000 4z M6 11h2 M6 14h2 M5 2l5 5",
};

export default function Icon({ name, size = 20, className = "", strokeWidth = 1.5, style }: IconProps) {
  const d = iconPaths[name];
  if (!d) return null;

  // Split multi-path data (separated by " M" patterns) into individual paths
  const paths = d.split(/(?= M)/).map((p) => p.trim());

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths.map((pathD, i) => (
        <path key={i} d={pathD} />
      ))}
    </svg>
  );
}

// Re-export for convenience
export { type IconProps };
