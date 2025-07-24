import type { Meta, StoryObj } from '@storybook/react';
import LoginFormCard from './login-form-card';
import { useState } from 'react';

const meta = {
  title: 'Components/LoginFormCard',
  component: LoginFormCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onLogin: {
      action: 'logged in',
      description: 'Callback function called when login is successful',
    },
  },
} satisfies Meta<typeof LoginFormCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCallback: Story = {
  render: () => {
    const [loggedIn, setLoggedIn] = useState(false);
    
    return (
      <div className="space-y-4">
        {!loggedIn ? (
          <LoginFormCard onLogin={() => setLoggedIn(true)} />
        ) : (
          <div className="text-center p-8 border rounded-lg">
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Successfully logged in!
            </h2>
            <button
              onClick={() => setLoggedIn(false)}
              className="text-sm text-blue-600 hover:underline"
            >
              Reset demo
            </button>
          </div>
        )}
      </div>
    );
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div className="dark bg-gray-900 p-8">
        <Story />
      </div>
    ),
  ],
};

export const InContext: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to Forecasting</h1>
          <p className="text-muted-foreground">
            Please log in to access your forecasts
          </p>
        </div>
        <LoginFormCard />
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Instructions for testing validation:
        </h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-6">
          <li>Username must contain only lowercase letters, numbers, or underscores</li>
          <li>Username must be between 2-30 characters</li>
          <li>Password must be between 8-30 characters</li>
          <li>Try invalid inputs like "User Name" (with space) or short passwords</li>
        </ul>
      </div>
      <LoginFormCard />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};