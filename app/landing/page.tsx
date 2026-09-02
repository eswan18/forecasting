import Link from "next/link";
import { ORIGINAL } from "./riso-seeds";

export const metadata = {
  title: "Haruspex — design",
};

/**
 * Entry point for the two mocked surfaces. Styled in the app's existing
 * language rather than in Riso, so it stays clearly out of the design.
 */

const PAGES = [
  {
    href: "/landing/riso",
    name: "Landing page",
    note: "The public front door for logged-out visitors.",
  },
  {
    href: "/landing/riso/competition",
    name: "Competition page",
    note: "A simple /competitions/{id} in the same print language.",
  },
];

export default function LandingIndex() {
  return (
    <main className="py-12 lg:py-16">
      <div className="mx-auto w-full max-w-3xl px-6">
        <header className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Haruspex · design
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            The riso direction
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A risograph pamphlet: two inks on warm stock, a halftone screen that
            lives in the ink rather than on the paper, one 6px registration
            error reused wherever the drums meet, hard edges, and a big number
            as the argument. The landing page is built around a giant trend line
            that runs the full height behind the copy and doubles as the section
            divider.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <h2 className="text-lg font-semibold tracking-tight group-hover:text-primary">
                {p.name}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.note}</p>
            </Link>
          ))}
        </div>

        <dl className="mt-10 max-w-sm">
          {[
            ["Ink", ORIGINAL.ink.name],
            ["Stock", ORIGINAL.stock.name],
            ["Dark ink", ORIGINAL.dark.name],
            ["Screen", ORIGINAL.screen.name],
            ["Registration", ORIGINAL.reg.name],
            ["Measure", `${ORIGINAL.measure.name} · ${ORIGINAL.measure.value}`],
            ["Rule", ORIGINAL.rule.name],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-t py-1.5"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </dt>
              <dd className="text-right font-mono text-xs tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
