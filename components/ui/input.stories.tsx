import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="grid gap-4 w-[350px]">
      <div>
        <Label htmlFor="text">Text Input</Label>
        <Input type="text" id="text" placeholder="Enter text" />
      </div>
      <div>
        <Label htmlFor="email">Email Input</Label>
        <Input type="email" id="email" placeholder="name@example.com" />
      </div>
      <div>
        <Label htmlFor="password">Password Input</Label>
        <Input type="password" id="password" placeholder="••••••••" />
      </div>
      <div>
        <Label htmlFor="number">Number Input</Label>
        <Input type="number" id="number" placeholder="0" />
      </div>
      <div>
        <Label htmlFor="search">Search Input</Label>
        <Input type="search" id="search" placeholder="Search..." />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="grid gap-4 w-[350px]">
      <div>
        <Label>Default</Label>
        <Input placeholder="Default input" />
      </div>
      <div>
        <Label>Disabled</Label>
        <Input placeholder="Disabled input" disabled />
      </div>
      <div>
        <Label>With Value</Label>
        <Input defaultValue="Input with value" />
      </div>
      <div>
        <Label>Read Only</Label>
        <Input value="Read only input" readOnly />
      </div>
    </div>
  ),
};

export const FileInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" />
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="username">Username</Label>
      <Input type="text" id="username" placeholder="johndoe" />
      <p className="text-sm text-muted-foreground">
        This is your public display name.
      </p>
    </div>
  ),
};
