import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CreateEditCompetitionForm } from "./create-edit-competition-form";

const meta = {
  title: "Competition/CreateEditCompetitionForm",
  component: CreateEditCompetitionForm,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  // The form is only ever a dialog body, and the dialog is what carries the
  // form vocabulary, so a story without one would be styling nothing.
  decorators: [
    (Story) => (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new competition</DialogTitle>
          </DialogHeader>
          <Story />
        </DialogContent>
      </Dialog>
    ),
  ],
} satisfies Meta<typeof CreateEditCompetitionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Creating: the visibility choice is offered, and a public season wants dates. */
export const Create: Story = {};

/**
 * Editing: visibility is settled at creation and never shown again, because
 * flipping it would strand every prop written against the other deadline shape.
 */
export const Edit: Story = {
  args: {
    initialCompetition: {
      id: 6,
      name: "2026 Open",
      is_private: false,
      forecasts_open_date: new Date("2026-01-01T12:00:00Z"),
      forecasts_close_date: new Date("2026-09-07T12:00:00Z"),
      end_date: new Date("2026-12-30T12:00:00Z"),
    },
  },
};

/** A private competition runs off per-prop deadlines, so it asks for no dates. */
export const Private: Story = {
  args: {
    initialCompetition: {
      id: 9,
      name: "Swan Family Pool",
      is_private: true,
      forecasts_open_date: null,
      forecasts_close_date: null,
      end_date: null,
    },
  },
};
