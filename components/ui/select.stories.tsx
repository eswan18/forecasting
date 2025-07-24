import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';
import { useState } from 'react';

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
        <SelectItem value="watermelon">Watermelon</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe & Africa</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
          <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
          <SelectItem value="west">Western European Summer Time (WEST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          <SelectItem value="msk">Moscow Time (MSK)</SelectItem>
          <SelectItem value="ist">India Standard Time (IST)</SelectItem>
          <SelectItem value="cst_china">China Standard Time (CST)</SelectItem>
          <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("");
    
    return (
      <div className="space-y-4">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="csharp">C#</SelectItem>
            <SelectItem value="go">Go</SelectItem>
            <SelectItem value="rust">Rust</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Selected value: {value || "none"}
        </p>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <Select disabled>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Disabled select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
      
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Available Option</SelectItem>
          <SelectItem value="option2" disabled>Disabled Option</SelectItem>
          <SelectItem value="option3">Another Option</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const LongList: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent>
        {[
          "United States", "Canada", "Mexico", "Brazil", "Argentina",
          "United Kingdom", "France", "Germany", "Italy", "Spain",
          "Russia", "China", "Japan", "India", "Australia",
          "Egypt", "South Africa", "Nigeria", "Kenya", "Morocco"
        ].map((country) => (
          <SelectItem key={country.toLowerCase().replace(" ", "-")} value={country.toLowerCase().replace(" ", "-")}>
            {country}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const CustomWidth: Story = {
  render: () => (
    <div className="space-y-4">
      <Select>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Small" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="s">S</SelectItem>
          <SelectItem value="m">M</SelectItem>
          <SelectItem value="l">L</SelectItem>
          <SelectItem value="xl">XL</SelectItem>
        </SelectContent>
      </Select>
      
      <Select>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Wide select with longer options" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">This is a very long option that might wrap</SelectItem>
          <SelectItem value="option2">Another lengthy option to demonstrate width</SelectItem>
          <SelectItem value="option3">Short</SelectItem>
        </SelectContent>
      </Select>
      
      <Select>
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder="Full width (responsive)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="responsive1">Responsive Option 1</SelectItem>
          <SelectItem value="responsive2">Responsive Option 2</SelectItem>
          <SelectItem value="responsive3">Responsive Option 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};