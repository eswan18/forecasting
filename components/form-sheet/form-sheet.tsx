import Link from "next/link";

import { sheetCss } from "@/components/prop-list/sheet";

/*
 * The form vocabulary itself lives in `app/globals.css` under `.hxf`, not in
 * an injected <style> here. Radix portals dialog content to document.body, so
 * a rule scoped to a page's own class can never reach a dialog; putting the
 * rules in the stylesheet lets one copy serve both a full-page form and a
 * dialog body. Add `hxf` to whatever wraps the fields — `FormSheet` does it
 * for a page, and `DialogContent` does it for a dialog.
 */

/**
 * One labelled control.
 *
 * `htmlFor` is omitted for a group of inputs that has no single labelable
 * element — an options editor, a date picker — and those pass `labelId`
 * instead so the group can point at the label itself.
 */
export function Field({
  label,
  htmlFor,
  labelId,
  optional = false,
  hint,
  count,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  labelId?: string;
  optional?: boolean;
  hint?: string;
  /** `[used, limit]` — printed under the control and reddened when over. */
  count?: [number, number];
  error?: string;
  children: React.ReactNode;
}) {
  const heading = (
    <>
      {label}
      {optional && <span className="opt"> · optional</span>}
    </>
  );
  return (
    <div className={error ? "field bad" : "field"}>
      {htmlFor ? (
        <label htmlFor={htmlFor}>{heading}</label>
      ) : (
        <span className="lbl" id={labelId}>
          {heading}
        </span>
      )}
      {children}
      {(hint || count) && (
        <div className="under">
          <span className="hint">{hint}</span>
          {count && (
            <span className={count[0] > count[1] ? "count over" : "count"}>
              {count[0]}/{count[1]}
            </span>
          )}
        </div>
      )}
      {error && <p className="bad-msg">{error}</p>}
    </div>
  );
}

/** What the server said when it refused. */
export function Refusal({ message }: { message: string }) {
  return (
    <div className="failed" role="alert">
      <span className="lbl">That didn&apos;t save</span>
      <p>{message}</p>
    </div>
  );
}

/**
 * The page a form sits on: masthead, section head with a way back, then the
 * form itself held to a measure a line of prose can be read across.
 */
export function FormSheet({
  title,
  kicker,
  back,
  lede,
  extraCss = "",
  children,
}: {
  title: string;
  kicker: string;
  back?: { href: string; label: string };
  lede?: string;
  /** Anything the particular form needs on top of the shared vocabulary. */
  extraCss?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hxp">
      <style dangerouslySetInnerHTML={{ __html: sheetCss + extraCss }} />
      <div className="col">
        <header className="masthead">
          <h1>{back ? <Link href={back.href}>{title}</Link> : title}</h1>
        </header>
        <h2 className="kicker">
          <span>{kicker}</span>
          {back && (
            <Link className="aside" href={back.href}>
              ← {back.label}
            </Link>
          )}
        </h2>
        {lede && <p className="lede">{lede}</p>}
        <div className="hxf form">{children}</div>
      </div>
    </div>
  );
}
