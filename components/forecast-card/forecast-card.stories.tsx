import type { Meta, StoryObj } from '@storybook/react';
import ForecastCard from './forecast-card';
import { VForecast, VProp } from '@/types/db_types';

const meta = {
  title: 'Components/ForecastCard',
  component: ForecastCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    userId: {
      control: 'number',
      description: 'The ID of the current user',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof ForecastCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockProp: VProp = {
  prop_id: 1,
  prop_text: "Will the S&P 500 close above 5000 by end of Q1 2024?",
  prop_notes: "Based on current market trends and economic indicators",
  competition_id: 1,
  user_id: 1,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  resolution: null,
  resolution_id: null,
  resolution_notes: null,
  resolution_updated_at: null,
  resolution_user_id: null,
};

const mockForecast: VForecast = {
  ...mockProp,
  forecast_id: 1,
  forecast: 0.75,
  forecast_notes: "Strong economic indicators suggest upward momentum",
  forecast_created_at: new Date('2024-01-15'),
  forecast_updated_at: new Date('2024-01-15'),
  forecast_user_id: 1,
};

const mockResolvedForecast: VForecast = {
  ...mockForecast,
  resolution: 1,
  resolution_id: 1,
  resolution_notes: "S&P 500 closed at 5,123 on March 31, 2024",
  resolution_updated_at: new Date('2024-03-31'),
  resolution_user_id: 2,
};

export const PropWithoutForecast: Story = {
  args: {
    record: mockProp,
    userId: 1,
  },
};

export const PropWithForecast: Story = {
  args: {
    record: mockForecast,
    userId: 1,
  },
};

export const ResolvedForecast: Story = {
  args: {
    record: mockResolvedForecast,
    userId: 1,
  },
};

export const LongContent: Story = {
  args: {
    record: {
      ...mockForecast,
      prop_text: "Will artificial general intelligence (AGI) be achieved by any major tech company or research institution before 2030?",
      prop_notes: "AGI is defined as AI that matches or exceeds human cognitive abilities across all domains. This includes reasoning, learning, creativity, and general problem-solving. The achievement must be publicly announced and independently verified by at least three reputable AI research organizations.",
      forecast_notes: "While progress in AI has been rapid, true AGI remains a significant challenge. Current systems excel in narrow domains but lack general reasoning capabilities.",
    },
    userId: 1,
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ForecastCard
        record={{
          ...mockProp,
          prop_id: 1,
          prop_text: "Will Bitcoin reach $100,000 in 2024?",
          prop_notes: "All-time high consideration",
        }}
        userId={1}
      />
      <ForecastCard
        record={{
          ...mockForecast,
          prop_id: 2,
          prop_text: "Will SpaceX successfully land humans on Mars by 2030?",
          forecast: 0.25,
        }}
        userId={1}
      />
      <ForecastCard
        record={{
          ...mockResolvedForecast,
          prop_id: 3,
          prop_text: "Will GPT-5 be released in 2024?",
          resolution: 0,
          resolution_notes: "No GPT-5 release announced by end of 2024",
        }}
        userId={1}
      />
    </div>
  ),
};

export const DifferentStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Unforecasted Prop</h3>
        <ForecastCard
          record={mockProp}
          userId={1}
          className="max-w-md"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Active Forecast</h3>
        <ForecastCard
          record={{
            ...mockForecast,
            forecast: 0.90,
            forecast_notes: "Very likely based on current trajectory",
          }}
          userId={1}
          className="max-w-md"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Resolved - Correct</h3>
        <ForecastCard
          record={{
            ...mockResolvedForecast,
            forecast: 0.85,
            resolution: 1,
          }}
          userId={1}
          className="max-w-md"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Resolved - Incorrect</h3>
        <ForecastCard
          record={{
            ...mockResolvedForecast,
            forecast: 0.85,
            resolution: 0,
            resolution_notes: "Did not occur as predicted",
          }}
          userId={1}
          className="max-w-md"
        />
      </div>
    </div>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4">
      <ForecastCard
        record={mockForecast}
        userId={1}
        className="border-blue-500 shadow-lg"
      />
      <ForecastCard
        record={mockForecast}
        userId={1}
        className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950"
      />
    </div>
  ),
};