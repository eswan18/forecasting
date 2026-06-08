import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, ReactNode } from "react";
import type { PropWithUserForecast } from "@/types/db_types";
import {
  ForecastCardNeedleRight,
  ForecastCardNeedleHero,
  ForecastCardNeedleTile,
} from "./needle-experiments";
import { makeProp } from "./forecast-card.fixtures";

// Throwaway gallery for picking a needle-in-card direction.
const meta = {
  title: "Forecast/Needle Experiments",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type VariantComponent = ComponentType<{
  prop: PropWithUserForecast;
  showCommunityAvg: boolean;
}>;

const VARIANTS: { name: string; Component: VariantComponent }[] = [
  { name: "1 · NeedleRight", Component: ForecastCardNeedleRight },
  { name: "2 · NeedleHero", Component: ForecastCardNeedleHero },
  { name: "3 · NeedleTile", Component: ForecastCardNeedleTile },
];

const withAvg = makeProp({ user_forecast: 0.72, community_average: 0.58 });
const noAvg = makeProp({ user_forecast: 0.64, community_average: null });
const low = makeProp({ user_forecast: 0.14, community_average: 0.3 });
const high = makeProp({ user_forecast: 0.9, community_average: 0.78 });
const noForecast = makeProp({ user_forecast: null, user_forecast_id: null });

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function StatesStack({ Component }: { Component: VariantComponent }) {
  return (
    <div className="flex w-[640px] max-w-full flex-col gap-5">
      <Labeled label="With community avg">
        <Component prop={withAvg} showCommunityAvg />
      </Labeled>
      <Labeled label="Without community avg">
        <Component prop={noAvg} showCommunityAvg={false} />
      </Labeled>
      <Labeled label="Low probability">
        <Component prop={low} showCommunityAvg />
      </Labeled>
      <Labeled label="High probability">
        <Component prop={high} showCommunityAvg />
      </Labeled>
      <Labeled label="No forecast">
        <Component prop={noForecast} showCommunityAvg />
      </Labeled>
    </div>
  );
}

// All three directions for the same prop, stacked for a direct comparison.
export const Compare: Story = {
  render: () => (
    <div className="flex w-[640px] max-w-full flex-col gap-8">
      {VARIANTS.map(({ name, Component }) => (
        <Labeled key={name} label={name}>
          <Component prop={withAvg} showCommunityAvg />
        </Labeled>
      ))}
    </div>
  ),
};

export const NeedleRight: Story = {
  render: () => <StatesStack Component={ForecastCardNeedleRight} />,
};

export const NeedleHero: Story = {
  render: () => <StatesStack Component={ForecastCardNeedleHero} />,
};

export const NeedleTile: Story = {
  render: () => <StatesStack Component={ForecastCardNeedleTile} />,
};
