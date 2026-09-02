/**
 * The Riso spec.
 *
 * This started as a seeded derivation across ten axes, used to generate variants
 * of the winning design. The original won on every comparison, so the machinery
 * is gone and only the chosen spec remains — it still drives the competition
 * page's shared stylesheet through CSS custom properties.
 *
 * For the record, the design that produced these values came from the seed
 * "ely4aEk23f8N"; the variant round used "j4aKZvUWi/6ZD8Vi".
 */

export interface Ink {
  name: string;
  /** the drum colour, for fills and the offset ghost */
  fill: string;
  /** the darker mix used for small text, so it clears AA on stock */
  text: string;
}

export interface Stock {
  name: string;
  value: string;
}

export interface DarkInk {
  name: string;
  value: string;
}

export interface Screen {
  name: string;
  size: number;
  dot: number;
}

export interface Registration {
  name: string;
  x: number;
  y: number;
}

export interface Measure {
  name: string;
  value: string;
}

export interface Display {
  name: string;
  weight: number;
  upper: boolean;
  tracking: string;
}

export interface HeroNumber {
  figure: string;
  fig: string;
  label: string;
}

export interface Rule {
  name: string;
  value: string;
}

export type Blend = "multiply" | "darken" | "normal";

export interface RisoSpec {
  /** route segment under /landing */
  slug: string;
  name: string;
  ink: Ink;
  stock: Stock;
  dark: DarkInk;
  screen: Screen;
  reg: Registration;
  measure: Measure;
  display: Display;
  hero: HeroNumber;
  rule: Rule;
  blend: Blend;
}

export const ORIGINAL: RisoSpec = {
  slug: "riso",
  name: "Haruspex",
  ink: {
    name: "Bright Red",
    fill: "oklch(57% 0.165 22)",
    text: "oklch(52% 0.16 22)",
  },
  stock: { name: "Warm white", value: "oklch(95.8% 0.012 62)" },
  dark: { name: "Warm black", value: "oklch(21% 0.022 32)" },
  screen: { name: "Standard 6pt", size: 6, dot: 0.9 },
  reg: { name: "Standard 6px", x: 6, y: 6 },
  measure: { name: "Standard", value: "52rem" },
  display: { name: "Heavy", weight: 800, upper: false, tracking: "-0.055em" },
  hero: {
    figure: "0.000",
    fig: "a perfect score",
    label: "The Brier score of a forecaster who is never wrong.",
  },
  rule: { name: "Medium", value: "3px" },
  blend: "multiply",
};
