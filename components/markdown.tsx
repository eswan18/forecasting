import Markdown from "markdown-to-jsx";

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Renders markdown content with proper styling.
 * Supports links, bold, and italic formatting.
 *
 * Links carry `riso-md-link` rather than a colour of their own. They used to be
 * Tailwind's indigo `text-primary`, which meant every sheet had to override it
 * and any sheet that forgot printed an indigo link on riso paper — which is
 * what happened on the open-props list. The class is styled once, in globals.
 */
export function MarkdownRenderer({ children, className }: MarkdownProps) {
  return (
    <Markdown
      options={{
        overrides: {
          a: {
            component: "a",
            props: {
              className: "riso-md-link",
              target: "_blank",
              rel: "noopener noreferrer",
            },
          },
          strong: {
            component: "strong",
            props: {
              className: "font-semibold",
            },
          },
          em: {
            component: "em",
            props: {
              className: "italic",
            },
          },
        },
      }}
      className={className}
    >
      {children}
    </Markdown>
  );
}
