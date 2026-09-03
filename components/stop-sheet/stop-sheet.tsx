import Link from "next/link";

/**
 * The sheet the app prints when it has nothing else to print.
 *
 * Self-contained on purpose: `global-error` replaces the root layout, so this
 * cannot assume the app's fonts or the `.hxp` sheets are on the page. Every
 * token falls back to a literal, and the font stacks name their own fallbacks
 * rather than relying on a `--font-*` variable existing.
 */
const stopCss = `
.hxstop {
  --paper: var(--riso-paper, #f4efe8);
  --ink: var(--riso-ink, #2b1e1a);
  --red: var(--riso-red, #c0392f);
  --red-text: var(--riso-red-text, #b03328);
  --rule: color-mix(in oklab, var(--ink) 22%, transparent);
  --ink-muted: color-mix(in oklab, var(--ink) 70%, transparent);
  --ink-faint: color-mix(in oklab, var(--ink) 38%, transparent);

  font-family: var(--font-archivo, ui-sans-serif), system-ui, sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
  line-height: 1.6;
}
body:has(.hxstop) { background: var(--riso-paper, #f4efe8); margin: 0; }

.hxstop::before {
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
.hxstop .col {
  position: relative;
  z-index: 1;
  max-width: 58rem;
  margin: 0 auto;
  padding: 3.5rem 1.75rem 5rem;
}

/* The code is the page's whole headline, so it takes the plate the sheets
   reserve for a figure that carries an argument: ink over the halftone, the
   second ink offset behind it. */
.hxstop .code {
  font-weight: 800;
  font-size: clamp(3.5rem, 12vw, 6.5rem);
  line-height: 0.85;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  position: relative;
  display: inline-block;
  isolation: isolate;
  --offset: 0.075em;
}
.hxstop .code .ghost {
  position: absolute;
  inset: 0;
  color: var(--red);
  transform: translate(var(--offset), var(--offset));
  z-index: -1;
}
.hxstop .code .top-ink {
  color: var(--ink);
  background-image:
    radial-gradient(var(--paper) 0.75px, transparent 0.85px),
    radial-gradient(var(--paper) 0.75px, transparent 0.85px);
  background-size: 5px 5px;
  background-position: 0 0, 2.5px 2.5px;
  -webkit-background-clip: text;
  background-clip: text;
}

.hxstop h1 {
  font-family: var(--font-roboto-mono, ui-monospace), monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--red-text);
  margin: 2rem 0 0;
  padding-bottom: 0.875rem;
  border-bottom: 2px solid var(--ink);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.hxstop h1 .aside {
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  color: var(--ink-muted);
  text-decoration: none;
  white-space: nowrap;
}
.hxstop h1 a.aside:hover { color: var(--red-text); }

.hxstop .lede {
  padding-top: 1.75rem;
  max-width: 34rem;
  color: var(--ink-muted);
}
.hxstop .lede strong { color: var(--ink); font-weight: 600; }
.hxstop .detail {
  /* a line of its own: inline it runs straight on from the sentence above */
  display: block;
  margin-top: 0.75rem;
  font-family: var(--font-roboto-mono, ui-monospace), monospace;
  font-size: 0.75rem;
  color: var(--ink-faint);
  word-break: break-word;
}

.hxstop .acts { display: flex; flex-wrap: wrap; gap: 1.5rem; padding-top: 2.5rem; }
.hxstop .act {
  font-family: var(--font-roboto-mono, ui-monospace), monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  background: none;
  border: 0;
  border-bottom: 1px solid color-mix(in oklab, var(--ink) 40%, transparent);
  padding: 0 0 0.25rem;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}
.hxstop .act:hover { color: var(--red-text); border-bottom-color: var(--red-text); }
.hxstop .act.primary { color: var(--ink); font-weight: 700; border-bottom-width: 2px; border-bottom-color: var(--ink); }
.hxstop .act.primary:hover { color: var(--red-text); border-bottom-color: var(--red-text); }
`;

export interface StopAction {
  label: string;
  /** A link out, or a button when `onClick` is given instead. */
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

export interface StopSheetProps {
  /** The plated headline: a status number or a single word. */
  code: string;
  /** What happened, as a sentence. */
  title: string;
  /** Optional second line with more of the story. */
  message?: string;
  /** Machine detail — an error string, a digest — set small and mono. */
  detail?: string;
  actions?: StopAction[];
  /** Anything else the caller wants under the message. */
  children?: React.ReactNode;
}

export function StopSheet({
  code,
  title,
  message,
  detail,
  actions = [{ label: "Return home", href: "/", primary: true }],
  children,
}: StopSheetProps) {
  return (
    <div className="hxstop">
      <style dangerouslySetInnerHTML={{ __html: stopCss }} />
      <div className="col">
        <span className="code">
          <span className="ghost" aria-hidden="true">
            {code}
          </span>
          <span className="top-ink">{code}</span>
        </span>

        <h1>
          <span>{title}</span>
        </h1>

        {message && (
          <p className="lede">
            {message}
            {detail && <span className="detail">{detail}</span>}
          </p>
        )}
        {!message && detail && <p className="detail lede">{detail}</p>}
        {children && <div className="lede">{children}</div>}

        {actions.length > 0 && (
          <div className="acts">
            {actions.map((action) =>
              action.href ? (
                <Link
                  key={action.label}
                  className={action.primary ? "act primary" : "act"}
                  href={action.href}
                >
                  ← {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  className={action.primary ? "act primary" : "act"}
                  onClick={action.onClick}
                >
                  ↻ {action.label}
                </button>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
