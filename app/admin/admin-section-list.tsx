import Link from "next/link";

/**
 * The admin index, set as an index: a section per line, what it does beside it,
 * a hairline between two of them. The five cards this replaced carried a badge,
 * a glyph and a corner arrow each — five boxes to say five words, on a page
 * whose whole job is to hand the reader on somewhere else.
 */
export const sectionsCss = `
.hxp .entry {
  display: grid;
  grid-template-columns: minmax(0, 14rem) minmax(0, 1fr);
  gap: 0 1.5rem;
  align-items: baseline;
  padding: 1.125rem 0;
  border-bottom: 1px solid var(--rule);
  color: inherit;
  text-decoration: none;
}
.hxp .entry .nm { font-size: 1rem; }
/* The arrow is the affordance the card's corner glyph was, minus the box. */
.hxp .entry .nm::after { content: " →"; color: var(--ink-faint); }
.hxp .entry .what { color: var(--ink-muted); font-size: 0.875rem; }
.hxp .entry:hover .nm,
.hxp .entry:hover .nm::after { color: var(--red-text); }
.hxp .entry:focus-visible {
  outline: 2px solid var(--red);
  outline-offset: 3px;
}

@media (max-width: 46rem) {
  .hxp .entry { grid-template-columns: minmax(0, 1fr); gap: 0.25rem; }
}
`;

export interface AdminSection {
  href: string;
  title: string;
  description: string;
}

/** Every admin section, in the order the index prints them. */
export function AdminSectionList({ sections }: { sections: AdminSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <Link className="entry" key={section.href} href={section.href}>
          <span className="nm">{section.title}</span>
          <span className="what">{section.description}</span>
        </Link>
      ))}
    </>
  );
}
