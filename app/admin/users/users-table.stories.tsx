import type { Meta, StoryObj } from "@storybook/react-vite";

import type { VUser } from "@/types/db_types";

import UsersTable from "./users-table";

/**
 * A stand-in portrait, so a story has a photograph without reaching off the
 * machine for one. Tonal rather than flat, because the entry prints a photo in
 * one ink and a flat fill would show none of what that does to a real face.
 */
function photo(hue: number) {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56">' +
        "<defs>" +
        `<radialGradient id="g" cx="42%" cy="32%" r="78%">` +
        `<stop offset="0" stop-color="hsl(${hue} 38% 78%)"/>` +
        `<stop offset="1" stop-color="hsl(${hue} 42% 34%)"/>` +
        "</radialGradient>" +
        "</defs>" +
        '<rect width="56" height="56" fill="url(#g)"/>' +
        `<circle cx="28" cy="22" r="10" fill="hsl(${hue} 30% 88%)"/>` +
        `<path d="M6 56c0-12 10-20 22-20s22 8 22 20z" fill="hsl(${hue} 30% 84%)"/>` +
        "</svg>",
    )
  );
}

let nextId = 1;
function account(
  name: string,
  email: string,
  extra: Partial<VUser> = {},
): VUser {
  return {
    id: nextId++,
    name,
    email,
    is_admin: false,
    deactivated_at: null,
    idp_user_id: null,
    username: null,
    picture_url: null,
    created_at: new Date("2026-01-04T00:00:00Z"),
    updated_at: new Date("2026-01-04T00:00:00Z"),
    ...extra,
  };
}

/** Twenty-six accounts, which is what the real page holds. */
const data: VUser[] = [
  account("Ethan Swan", "ethanpswan@gmail.com", {
    is_admin: true,
    picture_url: photo(20),
  }),
  account("Brian Van Fossen", ""),
  account("Alex Van Fossen", "avanfossen12@gmail.com"),
  account("David Schmitz", "schmavd@gmail.com", { picture_url: photo(200) }),
  account("Lizz Hyde", "lizzhyde@gmail.com"),
  account("Phil Anderson", "panders225@gmail.com"),
  account("Raluca Pavel", "ralucapavel93@gmail.com"),
  account("Maggie Chen", "maggie.chen@gmail.com", { is_admin: true }),
  account("Tom Whitlock", "twhitlock@gmail.com"),
  account("Nina Okafor", "nina.okafor@gmail.com", { picture_url: photo(320) }),
  account("Greg Salinas", "gsalinas@gmail.com"),
  account("Priya Raman", "priya.raman@gmail.com"),
  account("Owen Brady", "obrady@gmail.com"),
  account("Sasha Petrov", "sasha.petrov@gmail.com"),
  account("Marcus Hale", "mhale@gmail.com"),
  account("Ingrid Bloom", "ingrid.bloom@gmail.com"),
  account("Danny Kwon", "dkwon@gmail.com"),
  account("Ruth Adeyemi", "radeyemi@gmail.com"),
  account("Carlos Mendez", "cmendez@gmail.com"),
  account("Fiona Walsh", "fwalsh@gmail.com"),
  account("Jonas Berg", "jberg@gmail.com"),
  account("Amara Diallo", "adiallo@gmail.com"),
  account("Victor Reyes", "vreyes@gmail.com"),
  account("Helen Osei", "hosei@gmail.com"),
  // With a photo, so the story covers what closing an account does to one: the
  // name goes pale, and the picture comes off the plate.
  account("Sam Reed", "sam.reed@gmail.com", {
    picture_url: photo(140),
    deactivated_at: new Date("2026-06-01T00:00:00Z"),
  }),
  account("Old Test Account", "test@example.com", {
    deactivated_at: new Date("2026-03-12T00:00:00Z"),
  }),
];

const meta = {
  title: "Admin/UsersDirectory",
  component: UsersTable,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { data, currentUserId: 1 },
} satisfies Meta<typeof UsersTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The whole directory: three groups, alphabetical inside each. */
export const Directory: Story = {};

/** Nobody has signed up yet. */
export const Empty: Story = {
  args: { data: [] },
};

/** No account is closed, so the page prints two groups rather than three. */
export const NoneDeactivated: Story = {
  args: { data: data.filter((u) => u.deactivated_at === null) },
};
