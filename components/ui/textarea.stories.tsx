import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';
import { Label } from './label';
import { useState } from 'react';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    rows: {
      control: 'number',
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Type your message here...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const maxLength = 200;
    
    return (
      <div className="w-full max-w-sm space-y-2">
        <div className="grid gap-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={maxLength}
          />
          <p className="text-sm text-muted-foreground text-right">
            {value.length}/{maxLength}
          </p>
        </div>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
    defaultValue: 'You cannot edit this text',
  },
};

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'This is some default text that appears when the component loads.',
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div>
        <Label>Small (3 rows)</Label>
        <Textarea placeholder="Small textarea" rows={3} />
      </div>
      <div>
        <Label>Default (auto)</Label>
        <Textarea placeholder="Default textarea" />
      </div>
      <div>
        <Label>Large (8 rows)</Label>
        <Textarea placeholder="Large textarea" rows={8} />
      </div>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="error-message">Message</Label>
      <Textarea
        id="error-message"
        placeholder="Type your message here."
        className="border-red-500 focus-visible:ring-red-500"
        aria-invalid="true"
        aria-describedby="error-message-error"
      />
      <p id="error-message-error" className="text-sm text-red-500">
        This field is required
      </p>
    </div>
  ),
};

export const Resizable: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="resizable">Resizable textarea</Label>
      <Textarea
        id="resizable"
        placeholder="You can resize this textarea by dragging the corner..."
        className="resize min-h-[100px]"
      />
    </div>
  ),
};

export const NonResizable: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="non-resizable">Non-resizable textarea</Label>
      <Textarea
        id="non-resizable"
        placeholder="This textarea cannot be resized..."
        className="resize-none"
      />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="w-full max-w-md space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="feedback">Feedback</Label>
        <Textarea
          id="feedback"
          placeholder="We'd love to hear your thoughts..."
          rows={5}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="suggestions">Suggestions for improvement</Label>
        <Textarea
          id="suggestions"
          placeholder="Any ideas on how we can do better?"
          rows={4}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Submit Feedback
      </button>
    </form>
  ),
  parameters: {
    layout: 'padded',
  },
};