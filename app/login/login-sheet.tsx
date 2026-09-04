"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Haruspecs } from "@/components/brand/haruspecs";

const sheetCss = `
.hxl {
  --paper: var(--riso-paper);
  --ink: var(--riso-ink);
  --red: var(--riso-red);
  --red-text: var(--riso-red-text);
  --ink-muted: color-mix(in oklab, var(--ink) 70%, transparent);
  --ink-faint: color-mix(in oklab, var(--ink) 38%, transparent);

  font-family: var(--font-archivo), ui-sans-serif, system-ui, sans-serif;
  background: var(--paper);
  color: var(--ink);
  position: relative;
  overflow-x: hidden;
  line-height: 1.6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem 4rem;
}
/* The panel centres in what is left of the viewport, not in the viewport
   itself. The chrome above is not a fixed height — the navbar is joined by an
   environment banner, an impersonation banner, an admin banner, none of them
   always there — so the column flexes and the sheet takes the remainder
   instead of subtracting a number that is wrong in most environments.
   The body uses --riso-paper, not --paper: the sheet's own tokens are scoped
   to .hxl and would resolve to nothing out here. */
body:has(.hxl) {
  background: var(--riso-paper);
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
body:has(.hxl) > div:has(.hxl) { display: flex; flex: 1; }
.hxl { flex: 1; }

.hxl::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(var(--ink) 0.7px, transparent 0.9px),
    radial-gradient(var(--ink) 0.7px, transparent 0.9px);
  background-size: 8.5px 8.5px;
  background-position: 0 0, 4.25px 4.25px;
  opacity: 0.05;
  pointer-events: none;
  z-index: 0;
}

/* One block, struck onto the stock. The frame is left unfilled so the dot
   field runs straight through it — the border is the whole statement, and a
   panel that painted over the paper would read as a card from another app. */
.hxl .box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 24rem;
  border: 3px solid var(--ink);
  padding: 1.75rem 1.75rem 2rem;
}

/* The mark sits above the one word this page says, at the width of about two
   of its letters, so it reads as a masthead rather than an illustration. */
.hxl .mark {
  display: block;
  margin: 0 auto 1.25rem;
  color: var(--ink);
}
.hxl h1 {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--red-text);
  margin: 0;
  padding-bottom: 0.875rem;
  border-bottom: 2px solid var(--ink);
}

/* The one solid area of ink anywhere in this app. Every other sheet draws with
   rules and refuses fills; this page exists to be pressed once, so the mark
   that matters gets a whole plate. */
.hxl .signin {
  display: block;
  width: 100%;
  margin-top: 1.75rem;
  padding: 1.0625rem 1.25rem;
  background: var(--ink);
  color: var(--paper);
  border: 0;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease;
}
.hxl .signin:hover:not(:disabled) { background: var(--red); }
.hxl .signin:focus-visible { outline: 2px solid var(--red); outline-offset: 3px; }
.hxl .signin:disabled { background: var(--ink-faint); cursor: default; }
.hxl .signin .arrow { float: right; }

.hxl .note {
  padding-top: 1rem;
  margin: 0;
  font-size: 0.8125rem;
  color: var(--ink-muted);
}

/* A refusal is the only thing that can outrank the button, so it prints above
   it, in the second ink, on its own rule. */
.hxl .failed {
  margin-top: 1.5rem;
  border-left: 3px solid var(--red);
  padding: 0.125rem 0 0.125rem 0.875rem;
}
.hxl .failed .lbl {
  display: block;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--red-text);
}
.hxl .failed p { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--ink-muted); }
`;

export interface LoginSheetProps {
  redirectUrl?: string;
  /** An OAuth failure handed back on the query string. */
  initialError?: string;
  /** The route's own loading state: the door is drawn, not yet usable. */
  pending?: boolean;
}

/**
 * The way in, and nothing else.
 *
 * No wordmark — the navbar above is already the masthead — and no pitch: this
 * is a door, not a landing page. With only one control on it the page has
 * nothing to hold a left edge against, so unlike every other sheet this one
 * centres, and the panel gives the button something to sit inside.
 */
export function LoginSheet({
  redirectUrl = "/",
  initialError,
  pending = false,
}: LoginSheetProps) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const busy = pending || leaving;

  const signIn = () => {
    setLeaving(true);
    router.push(`/oauth/login?returnUrl=${encodeURIComponent(redirectUrl)}`);
  };

  return (
    <div className="hxl">
      <style dangerouslySetInnerHTML={{ __html: sheetCss }} />
      <div className="box">
        <Haruspecs className="mark" width={104} title="Haruspex" />
        <h1>Sign in</h1>

        {initialError && (
          <div className="failed" role="alert">
            <span className="lbl">Authentication failed</span>
            <p>{initialError}</p>
          </div>
        )}

        <button
          type="button"
          className="signin"
          onClick={signIn}
          disabled={busy}
        >
          {busy ? "Redirecting…" : "Continue"}
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
        <p className="note">
          You&apos;ll be redirected to your identity provider.
        </p>
      </div>
    </div>
  );
}
