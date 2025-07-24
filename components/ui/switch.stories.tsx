import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import { Label } from './label';

const meta = {
  title: 'UI/Switch',
  component: Switch,
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
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="checked" defaultChecked />
      <Label htmlFor="checked">Enabled by default</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off" className="opacity-50">
          Disabled (Off)
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on" className="opacity-50">
          Disabled (On)
        </Label>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Marketing emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about new products, features, and more.
              </p>
            </div>
            <Switch id="marketing" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="security">Security alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts about your account security.
              </p>
            </div>
            <Switch id="security" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="beta">Beta features</Label>
              <p className="text-sm text-muted-foreground">
                Get early access to new features.
              </p>
            </div>
            <Switch id="beta" />
          </div>
        </div>
      </div>
    </div>
  ),
};