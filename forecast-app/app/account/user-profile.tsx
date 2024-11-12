"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserUpdate, VUser } from "@/types/db_types";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateLogin, updateUser } from "@/lib/db_actions";
import { LoaderCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AccountDetails() {
  const { user, loading, mutate } = useCurrentUser();
  async function mutateUser(updatedUser: UserUpdate) {
    user && mutate({ ...user, ...updatedUser });
  }
  async function mutateUsername(username: string) {
    user && mutate({ ...user, username });
  }
  return (
    <div className="mt-4 space-y-12">
      {user &&
        <>
          <UserDetailsSection initialUser={user} mutateUser={mutateUser} />
          <LoginDetailsSection loginId={user.login_id || -999} initialUsername={user.username || ""} mutateUsername={mutateUsername} />
        </>
      }
    </div >
  )
}

const userDetailsFormSchema = z.object({
  name: z.string().regex(
    /^[a-zA-Z \-]+$/,
    "Must contain only letters, hyphens, and spaces",
  ).min(2).max(30),
  email: z.string().email(),
});

function UserDetailsSection(
  { initialUser, mutateUser }: { initialUser: VUser, mutateUser: (updatedUser: UserUpdate) => void }
) {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof userDetailsFormSchema>>({
    resolver: zodResolver(userDetailsFormSchema),
    defaultValues: initialUser,
  });
  async function onSubmit(values: z.infer<typeof userDetailsFormSchema>) {
    if (!form.formState.isDirty) {
      return;
    }
    setLoading(true);
    await updateUser({ id: initialUser.id, user: values });
    form.reset(values);
    mutateUser(values);
    setLoading(false);
  }
  return (
    <div>
      <h2 className="text-xl mb-6">User Details</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="name" render={({ field }) => (
            <AccountFormItem>
              <AccountFormLabel>Name</AccountFormLabel>
              <AccountFormInputControl>
                <Input {...field} />
              </AccountFormInputControl>
              <AccountFormMessage />
            </AccountFormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <AccountFormItem>
              <AccountFormLabel>Email</AccountFormLabel>
              <AccountFormInputControl>
                <Input {...field} />
              </AccountFormInputControl>
              <AccountFormMessage />
            </AccountFormItem>
          )} />
          {loading
            ?
            <div className="grid grid-cols-3 gap-4">
              <div className="col-start-2 col-span-2 flex flex-row justify-center"><LoaderCircle className="animate-spin" /></div>
            </div>
            :
            <div className="grid grid-cols-3 gap-4">
              <Button type="submit" disabled={!form.formState.isDirty} className="col-start-2 col-span-2">Update</Button>
            </div>
          }
        </form>
      </Form>
    </div >
  )
}

const usernameFormSchema = z.object({
  username: z.string().regex(
    /^[a-z0-9_]+$/,
    "Must contain only lowercase letters, numbers, or underscores",
  ).min(2).max(30),
});

function LoginDetailsSection(
  { loginId, initialUsername, mutateUsername }: { loginId: number, initialUsername: string, mutateUsername: (username: string) => void }
) {
  return (
    <div>
      <h2 className="text-xl mb-6">Login Details</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <AccountLabel>Username</AccountLabel>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="submit" className="col-start-2 col-span-2">Change Username</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Username</DialogTitle>
              </DialogHeader>
              <UsernameForm />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <AccountLabel>Password</AccountLabel>
          <Button type="submit" className="col-start-2 col-span-2">Change Password</Button>
        </div>
      </div>
    </div>
  )
}

function UsernameForm() {
  const { user, mutate } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof usernameFormSchema>>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: { username: user?.username || undefined },
  });
  async function onSubmit(values: z.infer<typeof usernameFormSchema>) {
    if (!form.formState.isDirty) {
      return;
    }
    setLoading(true);
    user && user.login_id && await updateLogin({ id: user?.login_id, login: values });
    form.reset(values);
    user && mutate({ ...user, username: values.username });
    setLoading(false);
  }
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="username" render={({ field }) => (
            <AccountFormItem>
              <AccountFormLabel>Username</AccountFormLabel>
              <AccountFormInputControl>
                <Input {...field} />
              </AccountFormInputControl>
              <AccountFormMessage />
            </AccountFormItem>
          )} />
          {loading
            ?
            <div className="grid grid-cols-3 gap-4">
              <div className="col-start-2 col-span-2 flex flex-row justify-center"><LoaderCircle className="animate-spin" /></div>
            </div>
            :
            <div className="grid grid-cols-3 gap-4">
              <Button type="submit" disabled={!form.formState.isDirty} className="col-start-2 col-span-2">Update</Button>
            </div>
          }
        </form>
      </Form>
    </>
  )
}

function AccountFormItem({ children }: { children: React.ReactNode }) {
  return <FormItem className="grid grid-cols-3 gap-4 space-y-0 w-full">{children}</FormItem>
}

function AccountFormLabel({ children }: { children: React.ReactNode }) {
  return <FormLabel className="h-9 w-full py-1 flex flex-row items-center text-base justify-end">{children}</FormLabel>
}

function AccountLabel({ children }: { children: React.ReactNode }) {
  return <Label className="h-9 w-full py-1 flex flex-row items-center text-base justify-end">{children}</Label>
}

function AccountFormInputControl({ children }: { children: React.ReactNode }) {
  return <FormControl className="col-span-2">{children}</FormControl>
}

function AccountFormMessage() {
  return <FormMessage className="col-start-2 col-span-2" />
}