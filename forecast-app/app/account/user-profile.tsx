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
          <UserDetailsForm initialUser={user} mutateUser={mutateUser} />
          <LoginDetailsForm loginId={user.login_id || -999} initialUsername={user.username || ""} mutateUsername={mutateUsername} />
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

function UserDetailsForm(
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

const loginDetailsFormSchema = z.object({
  username: z.string().regex(
    /^[a-z0-9_]+$/,
    "Must contain only lowercase letters, numbers, or underscores",
  ).min(2).max(30),
});

function LoginDetailsForm(
  { loginId, initialUsername, mutateUsername }: { loginId: number, initialUsername: string, mutateUsername: (username: string) => void }
) {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof loginDetailsFormSchema>>({
    resolver: zodResolver(loginDetailsFormSchema),
    defaultValues: { username: initialUsername },
  });
  async function onSubmit(values: z.infer<typeof loginDetailsFormSchema>) {
    if (!form.formState.isDirty) {
      return;
    }
    setLoading(true);
    await updateLogin({ id: loginId, login: values });
    form.reset(values);
    mutateUsername(values.username);
    setLoading(false);
  }
  return (
    <div>
      <h2 className="text-xl mb-6">Login Details</h2>
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
    </div>
  )
}

function AccountFormItem({ children }: { children: React.ReactNode }) {
  return <FormItem className="grid grid-cols-3 gap-4 space-y-0 w-full">{children}</FormItem>
}

function AccountFormLabel({ children }: { children: React.ReactNode }) {
  return <FormLabel className="h-9 w-full py-1 flex flex-row items-center text-base justify-end">{children}</FormLabel>
}

function AccountFormInputControl({ children }: { children: React.ReactNode }) {
  return <FormControl className="col-span-2">{children}</FormControl>
}

function AccountFormMessage() {
  return <FormMessage className="col-start-2 col-span-2" />
}