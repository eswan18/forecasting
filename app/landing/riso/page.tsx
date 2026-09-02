import { SignedOutLanding } from "@/components/signed-out-landing";
import type { ToggleVariant } from "@/components/landing-theme-toggle";

export const metadata = {
  title: "Haruspex — 0.000",
};

/** Preview route. `?toggle=` swaps the stock-switch treatment while we pick one. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ toggle?: string }>;
}) {
  const { toggle } = await searchParams;
  const allowed: ToggleVariant[] = ["press", "link", "chip", "bar", "colophon"];
  const variant = allowed.find((v) => v === toggle) ?? "link";
  return <SignedOutLanding toggle={variant} />;
}
