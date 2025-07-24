import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { Label } from './label';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="checked" defaultChecked />
      <Label htmlFor="checked">This is checked by default</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-unchecked" disabled />
        <Label htmlFor="disabled-unchecked" className="opacity-50">
          Disabled unchecked
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked" className="opacity-50">
          Disabled checked
        </Label>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base">Email Notifications</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="marketing" />
            <Label
              htmlFor="marketing"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Marketing emails
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="security" defaultChecked />
            <Label
              htmlFor="security"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Security emails
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="updates" />
            <Label
              htmlFor="updates"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Product updates
            </Label>
          </div>
        </div>
      </div>
    </form>
  ),
};