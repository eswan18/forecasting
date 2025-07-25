"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserUpdate, VUser } from "@/types/db_types";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateLogin, updateUser } from "@/lib/db_actions";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateLoginPassword } from "@/lib/auth";
import { useServerAction } from "@/hooks/use-server-action";

export function AccountDetails() {
  const { user, isLoading, mutate } = useCurrentUser();
  async function mutateUser(updatedUser: UserUpdate) {
    user && mutate({ ...user, ...updatedUser });
  }
  return (
    <div className="mt-4 space-y-12">
      {user &&
        (
          <>
            {!isLoading && (
              <UserDetailsSection initialUser={user} mutateUser={mutateUser} />
            )}
            <LoginDetailsSection />
          </>
        )}
    </div>
  );
}

const userDetailsFormSchema = z.object({
  name: z.string().regex(
    /^[a-zA-Z \-]+$/,
    "Must contain only letters, hyphens, and spaces",
  ).min(2).max(30),
  email: z.string().email(),
});

function UserDetailsSection(
  { initialUser, mutateUser }: {
    initialUser: VUser;
    mutateUser: (updatedUser: UserUpdate) => void;
  },
) {
  const form = useForm<z.infer<typeof userDetailsFormSchema>>({
    resolver: zodResolver(userDetailsFormSchema),
    defaultValues: initialUser,
  });
  
  const updateUserAction = useServerAction(updateUser, {
    successMessage: 'Profile updated successfully',
    onSuccess: () => {
      const values = form.getValues();
      form.reset(values);
      mutateUser(values);
    },
  });
  
  async function onSubmit(values: z.infer<typeof userDetailsFormSchema>) {
    if (!form.formState.isDirty) {
      return;
    }
    
    await updateUserAction.execute({ id: initialUser.id, user: values });
  }
  
  return (
    <div>
      <h2 className="text-lg text-muted-foreground mb-4">User Details</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <AccountFormItem>
                <AccountFormLabel>Name</AccountFormLabel>
                <AccountFormInputControl>
                  <Input {...field} />
                </AccountFormInputControl>
                <AccountFormMessage />
              </AccountFormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <AccountFormItem>
                <AccountFormLabel>Email</AccountFormLabel>
                <AccountFormInputControl>
                  <Input {...field} />
                </AccountFormInputControl>
                <AccountFormMessage />
              </AccountFormItem>
            )}
          />
          {updateUserAction.isLoading
            ? (
              <div className="grid grid-cols-4 gap-4">
                <div className="col-start-2 col-span-2 flex flex-row justify-center">
                  <LoaderCircle className="animate-spin" />
                </div>
              </div>
            )
            : (
              <div className="grid grid-cols-4 gap-4">
                <Button
                  type="submit"
                  disabled={!form.formState.isDirty}
                  className="col-start-2 col-span-2"
                >
                  Update
                </Button>
              </div>
            )}
        </form>
      </Form>
    </div>
  );
}

function LoginDetailsSection() {
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  return (
    <div>
      <h2 className="text-lg text-muted-foreground mb-4">Login Details</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <AccountLabel>Username</AccountLabel>
          <Dialog
            open={usernameDialogOpen}
            onOpenChange={setUsernameDialogOpen}
          >
            <DialogTrigger asChild>
              <Button type="submit" className="col-start-2 col-span-2">
                Change Username
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="mb-2">
                <DialogTitle>Change Username</DialogTitle>
              </DialogHeader>
              <ChangeUsernameForm
                onSuccess={() => setUsernameDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <AccountLabel>Password</AccountLabel>
          <Dialog
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
          >
            <DialogTrigger asChild>
              <Button type="submit" className="col-start-2 col-span-2">
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="mb-2">
                <DialogTitle>Change Password</DialogTitle>
              </DialogHeader>
              <ChangePasswordForm
                onSuccess={() => setPasswordDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

const changeUsernameFormSchema = z.object({
  username: z.string().regex(
    /^[a-z0-9_]+$/,
    "Must contain only lowercase letters, numbers, or underscores",
  ).min(2).max(30),
});

function ChangeUsernameForm({ onSuccess }: { onSuccess: () => void }) {
  const { user, mutate } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof changeUsernameFormSchema>>({
    resolver: zodResolver(changeUsernameFormSchema),
    defaultValues: { username: user?.username || undefined },
  });
  async function onSubmit(values: z.infer<typeof changeUsernameFormSchema>) {
    if (!form.formState.isDirty) {
      return;
    }
    setLoading(true);
    const loginId = user?.login_id;
    if (!loginId) {
      setError("User not found");
      return;
    }
    const response = await updateLogin({ id: loginId, login: values }).catch(
      (e) => {
        const error = e instanceof Error ? e.message : "An error occurred";
        return { success: false, error };
      },
    );
    if (!response.success) {
      setError(response.error);
    } else {
      setError("");
      form.reset(values);
      user && mutate({ ...user, username: values.username });
      onSuccess();
    }
    setLoading(false);
  }
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {loading
            ? (
              <div className="col-start-2 col-span-2 flex flex-row justify-center w-32">
                <LoaderCircle className="animate-spin" />
              </div>
            )
            : (
              <Button
                type="submit"
                disabled={!form.formState.isDirty}
                className="w-32"
              >
                Update
              </Button>
            )}
          {error && (
            <div className="col-start-2 col-span-2 text-red-500">{error}</div>
          )}
        </form>
      </Form>
    </>
  );
}

const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(8).max(30),
  newPassword: z.string().min(8).max(30),
});

function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof changePasswordFormSchema>>({
    resolver: zodResolver(changePasswordFormSchema),
  });
  async function onSubmit(values: z.infer<typeof changePasswordFormSchema>) {
    const loginId = user?.login_id;
    if (!loginId) {
      return;
    }
    setLoading(true);
    const response = await updateLoginPassword({ id: loginId, ...values })
      .catch((e) => {
        const error = e instanceof Error ? e.message : "An error occurred";
        return { success: false, error };
      });
    if (!response.success) {
      setError(response.error);
    } else {
      setError("");
      onSuccess();
    }
    setLoading(false);
  }
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {loading
            ? (
              <div className="col-start-2 col-span-2 flex flex-row justify-center w-32">
                <LoaderCircle className="animate-spin" />
              </div>
            )
            : <Button type="submit" className="w-32">Update</Button>}
          {error && (
            <Alert
              variant="destructive"
              className="m-4 w-auto flex flex-row justify-start items-center"
            >
              <AlertTriangle className="h-8 w-8 mr-4 inline" />
              <div className="ml-4">
                <AlertTitle>Update Password Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}
        </form>
      </Form>
    </>
  );
}

function AccountFormItem({ children }: { children: React.ReactNode }) {
  return (
    <FormItem className="grid grid-cols-4 gap-4 space-y-0 w-full">
      {children}
    </FormItem>
  );
}

function AccountFormLabel({ children }: { children: React.ReactNode }) {
  return (
    <FormLabel className="h-9 w-full py-1 flex flex-row items-center text-base justify-end">
      {children}
    </FormLabel>
  );
}

function AccountLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="h-9 w-full py-1 flex flex-row items-center text-base justify-end">
      {children}
    </Label>
  );
}

function AccountFormInputControl({ children }: { children: React.ReactNode }) {
  return <FormControl className="col-span-2">{children}</FormControl>;
}

function AccountFormMessage() {
  return <FormMessage className="col-start-2 col-span-2" />;
}
