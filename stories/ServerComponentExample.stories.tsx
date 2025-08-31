import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServerComponentWrapper } from "@/.storybook/ServerComponentWrapper";

// Example of a component that might fetch data on the server
interface UserCardProps {
  userId?: number;
  userData?: {
    name: string;
    email: string;
    role: string;
  };
}

// Mock component that simulates a server component
function UserCard({ userData }: UserCardProps) {
  // In a real server component, this data might come from an async fetch
  const user = userData || {
    name: "John Doe",
    email: "john@example.com",
    role: "Developer",
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
        <CardDescription>{user.role}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </CardContent>
    </Card>
  );
}

const meta = {
  title: "Examples/Server Component Patterns",
  component: UserCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UserCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Example 1: Simple mock with static data
export const WithMockData: Story = {
  args: {
    userData: {
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Product Manager",
    },
  },
};

// Example 2: Using the ServerComponentWrapper
export const WithWrapper: Story = {
  render: () => (
    <ServerComponentWrapper>
      <UserCard
        userData={{
          name: "Alice Johnson",
          email: "alice@example.com",
          role: "Designer",
        }}
      />
    </ServerComponentWrapper>
  ),
};

// Example 3: Simulating loading states
export const LoadingState: Story = {
  render: () => (
    <ServerComponentWrapper
      fallback={
        <Card className="w-[350px]">
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      }
    >
      <UserCard />
    </ServerComponentWrapper>
  ),
};

// Example 4: Multiple components that might be server components
export const MultipleComponents: Story = {
  render: () => (
    <div className="grid gap-4">
      <ServerComponentWrapper>
        <UserCard
          userData={{
            name: "Team Lead",
            email: "lead@example.com",
            role: "Engineering Manager",
          }}
        />
      </ServerComponentWrapper>
      <ServerComponentWrapper>
        <UserCard
          userData={{
            name: "Developer",
            email: "dev@example.com",
            role: "Senior Developer",
          }}
        />
      </ServerComponentWrapper>
    </div>
  ),
};
