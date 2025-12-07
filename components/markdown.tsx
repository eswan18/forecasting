import Markdown from "markdown-to-jsx";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Renders markdown content with proper styling.
 * Supports links, bold, and italic formatting.
 */
export function MarkdownRenderer({ children, className }: MarkdownProps) {
  return (
    <Markdown
      options={{
        overrides: {
          a: {
            component: "a",
            props: {
              className: "text-primary underline-offset-4 hover:underline",
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
