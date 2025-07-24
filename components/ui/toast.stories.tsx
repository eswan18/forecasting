import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from './toaster';

// Wrapper component to demonstrate toast functionality
function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() => {
          toast({
            title: "Scheduled: Catch up",
            description: "Friday, February 10, 2023 at 5:57 PM",
          });
        }}
      >
        Show Toast
      </Button>
      <Toaster />
    </div>
  );
}

const meta = {
  title: 'UI/Toast',
  component: ToastDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => {
    const { toast } = useToast();

    return (
      <div className="flex flex-col gap-4">
        <Button
          onClick={() => {
            toast({
              title: "Success!",
              description: "Your changes have been saved.",
            });
          }}
        >
          Default Toast
        </Button>

        <Button
          variant="destructive"
          onClick={() => {
            toast({
              variant: "destructive",
              title: "Uh oh! Something went wrong.",
              description: "There was a problem with your request.",
            });
          }}
        >
          Destructive Toast
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            toast({
              title: "Info",
              description: "This is an informational message.",
            });
          }}
        >
          Info Toast
        </Button>

        <Toaster />
      </div>
    );
  },
};

export const WithAction: Story = {
  render: () => {
    const { toast } = useToast();

    return (
      <div className="flex flex-col gap-4">
        <Button
          onClick={() => {
            toast({
              title: "Email sent",
              description: "Your email has been sent successfully.",
              action: (
                <Button size="sm" variant="outline">
                  Undo
                </Button>
              ),
            });
          }}
        >
          Toast with Action
        </Button>
        <Toaster />
      </div>
    );
  },
};

export const LongContent: Story = {
  render: () => {
    const { toast } = useToast();

    return (
      <div className="flex flex-col gap-4">
        <Button
          onClick={() => {
            toast({
              title: "Database Migration Complete",
              description:
                "All database tables have been successfully migrated to the new schema. The process took 2 minutes and 34 seconds. No errors were encountered during the migration.",
            });
          }}
        >
          Long Content Toast
        </Button>
        <Toaster />
      </div>
    );
  },
};

export const MultipleToasts: Story = {
  render: () => {
    const { toast } = useToast();

    return (
      <div className="flex flex-col gap-4">
        <Button
          onClick={() => {
            toast({
              title: "First notification",
              description: "This is the first toast message.",
            });
            setTimeout(() => {
              toast({
                title: "Second notification",
                description: "This is the second toast message.",
              });
            }, 1000);
            setTimeout(() => {
              toast({
                variant: "destructive",
                title: "Error notification",
                description: "This is an error toast message.",
              });
            }, 2000);
          }}
        >
          Show Multiple Toasts
        </Button>
        <Toaster />
      </div>
    );
  },
};