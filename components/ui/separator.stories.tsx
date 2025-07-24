import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';

const meta = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <p className="text-sm text-muted-foreground">
          An open-source UI component library.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center">
      <div className="px-4">Left</div>
      <Separator orientation="vertical" />
      <div className="px-4">Center</div>
      <Separator orientation="vertical" />
      <div className="px-4">Right</div>
    </div>
  ),
};

export const InForm: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          placeholder="m@example.com"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        />
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        />
      </div>
    </div>
  ),
};

export const CustomStyles: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Default Separator</h3>
        <Separator className="mt-2" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Thick Separator</h3>
        <Separator className="mt-2 h-1" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Dashed Separator</h3>
        <div className="mt-2 border-t-2 border-dashed border-border" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Colored Separator</h3>
        <Separator className="mt-2 bg-primary" />
      </div>
    </div>
  ),
};