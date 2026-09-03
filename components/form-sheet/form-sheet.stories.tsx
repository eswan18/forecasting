import type { Meta, StoryObj } from "@storybook/react-vite";

import { Field, FormSheet, Refusal } from "./form-sheet";

const meta = {
  title: "Chrome/FormSheet",
  component: FormSheet,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof FormSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The whole vocabulary on one page: text, select, counts, hints, submit. */
export const Default: Story = {
  args: {
    title: "Suggest a prop",
    kicker: "New suggestion",
    back: { href: "/", label: "Home" },
    lede: "Propose something for a future season. An admin reviews every suggestion before it goes in.",
    children: (
      <form>
        <Field
          label="The claim"
          htmlFor="claim"
          hint="A statement that will turn out true or false. Markdown works."
          count={[42, 500]}
        >
          <textarea
            id="claim"
            rows={3}
            defaultValue="Bitcoin closes the year above $150,000."
          />
        </Field>
        <Field label="Kind" htmlFor="kind" hint="A yes/no claim, or a choice.">
          <select id="kind" className="pick" defaultValue="binary">
            <option value="binary">Yes / no</option>
            <option value="one_of">One of</option>
          </select>
        </Field>
        <Field
          label="Notes"
          htmlFor="notes"
          optional
          hint="How it should be settled."
          count={[0, 500]}
        >
          <textarea id="notes" rows={3} placeholder="Settled on…" />
        </Field>
        <div className="submitrow">
          <button type="button" className="submit">
            Send suggestion
            <span className="arrow">→</span>
          </button>
        </div>
      </form>
    ),
  },
};

/** A field the reader has to fix, and a refusal from the server. */
export const WithErrors: Story = {
  args: {
    title: "Swan Family Pool",
    kicker: "New prop",
    back: { href: "/competitions/9", label: "Overview" },
    children: (
      <form>
        <Field
          label="The claim"
          htmlFor="claim2"
          hint="A statement that will turn out true or false."
          count={[512, 300]}
          error="Keep the claim under 300 characters"
        >
          <textarea id="claim2" rows={3} defaultValue="Far too long a claim…" />
        </Field>
        <div className="pair">
          <Field
            label="Forecasts due"
            labelId="fd"
            hint="After this, nobody can change their number."
            error="The forecast deadline must be in the future"
          >
            <input type="text" defaultValue="12 Aug 2024" />
          </Field>
          <Field
            label="Resolves"
            labelId="rd"
            hint="When the answer should be known."
          >
            <input type="text" placeholder="When it settles" />
          </Field>
        </div>
        <Refusal message="A prop with that text already exists in this competition." />
        <div className="submitrow">
          <button type="button" className="submit">
            Create prop
            <span className="arrow">→</span>
          </button>
          <button type="button" className="quit">
            Cancel
          </button>
        </div>
      </form>
    ),
  },
};
