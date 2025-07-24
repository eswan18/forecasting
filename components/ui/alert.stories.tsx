import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          This is an informational alert with an icon.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning!</AlertTitle>
        <AlertDescription>
          This action cannot be undone. Please proceed with caution.
        </AlertDescription>
      </Alert>
      
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>
          Your changes have been saved successfully.
        </AlertDescription>
      </Alert>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>
          This feature is currently in beta. Some functionality may be limited.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>System Maintenance Notice</AlertTitle>
      <AlertDescription>
        We will be performing scheduled maintenance on our servers from 2:00 AM to 4:00 AM UTC. 
        During this time, you may experience intermittent service disruptions. We apologize for 
        any inconvenience this may cause and appreciate your patience. If you have any urgent 
        matters, please contact our support team.
      </AlertDescription>
    </Alert>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        This is a simple alert without a title, just a description.
      </AlertDescription>
    </Alert>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800 dark:text-blue-200">Custom Styled Alert</AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-300">
        This alert has custom colors applied through className props.
      </AlertDescription>
    </Alert>
  ),
};