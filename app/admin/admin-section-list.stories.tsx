import type { Meta, StoryObj } from "@storybook/react-vite";

import { sheetCss } from "@/components/prop-list/sheet";

import {
  AdminSectionList,
  sectionsCss,
  type AdminSection,
} from "./admin-section-list";

const sections: AdminSection[] = [
  {
    href: "/admin/users",
    title: "Users",
    description: "Browse accounts, manage access, and impersonate users.",
  },
  {
    href: "/admin/competitions",
    title: "Competitions",
    description: "Create competitions and review their props and resolutions.",
  },
  {
    href: "/admin/feature-flags",
    title: "Feature Flags",
    description: "Toggle features globally or for individual users.",
  },
  {
    href: "/admin/suggested-props",
    title: "Suggested Props",
    description: "Review propositions submitted by forecasters.",
  },
  {
    href: "/admin/forecast-progress/6",
    title: "Forecast Progress",
    description: "See how far along each forecaster is in a competition.",
  },
];

/** The index's own frame, so the list is seen on the page it lives on. */
function Sheet({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="hxp">
      <style dangerouslySetInnerHTML={{ __html: sheetCss + sectionsCss }} />
      <div className="col">
        <header className="masthead">
          <h1>Admin</h1>
        </header>
        <h2 className="kicker">
          <span>
            Sections<span className="aside num"> · {count}</span>
          </span>
        </h2>
        {children}
      </div>
    </div>
  );
}

const meta = {
  title: "Admin/AdminSectionList",
  component: AdminSectionList,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { sections },
  decorators: [
    (Story, context) => (
      <Sheet count={context.args.sections.length}>
        <Story />
      </Sheet>
    ),
  ],
} satisfies Meta<typeof AdminSectionList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every admin section, as the index prints them. */
export const Default: Story = {};

/** A long description wraps under the name it belongs to, not past it. */
export const LongDescription: Story = {
  args: {
    sections: [
      sections[0],
      {
        href: "/admin/feature-flags",
        title: "Feature Flags",
        description:
          "Toggle features globally or for individual users, including the ones still behind a flag while they are being tried out on a handful of forecasters.",
      },
    ],
  },
};
