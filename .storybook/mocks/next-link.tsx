import * as React from "react";

/**
 * Storybook stand-in for `next/link`: render a plain anchor.
 *
 * The real module pulls in Next's app-router client internals, whose circular
 * ESM imports trip a "Cannot access 'default' before initialization" TDZ error
 * under Vite's on-demand dev transform (production rollup hoists around it).
 */
type LinkProps = React.PropsWithChildren<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string | { pathname?: string };
  }
>;

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, children, ...props },
  ref,
) {
  const hrefStr = typeof href === "string" ? href : (href?.pathname ?? "#");
  return (
    <a ref={ref} href={hrefStr} {...props}>
      {children}
    </a>
  );
});

export default Link;
