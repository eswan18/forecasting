import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-muted-foreground">
          Make changes to your account here. Click save when you're done.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-muted-foreground">
          Change your password here. After saving, you'll be logged out.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithCards: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const MultipleTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[600px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Dashboard</h3>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your account.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="analytics" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Analytics</h3>
          <p className="text-muted-foreground">
            View detailed analytics and insights about your data.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="reports" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Reports</h3>
          <p className="text-muted-foreground">
            Generate and download reports for your records.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="notifications" className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Notifications</h3>
          <p className="text-muted-foreground">
            Manage your notification preferences and settings.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Settings (Coming Soon)
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-muted-foreground">
          Your account information and preferences.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-muted-foreground">
          Update your password and security settings.
        </p>
      </TabsContent>
    </Tabs>
  ),
};