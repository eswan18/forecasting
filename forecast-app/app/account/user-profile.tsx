"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VUser } from "@/types/db_types";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateUser } from "@/lib/db_actions";

const userDetailsFormSchema = z.object({
  name: z.string().regex(
    /^[a-zA-Z \-]+$/,
    "Must contain only letters, hyphens, and spaces",
  ).min(2).max(30),
  email: z.string().email(),
});

const loginDetailsFormSchema = z.object({
  username: z.string().regex(
    /^[a-z0-9_]+$/,
    "Must contain only lowercase letters, numbers, or underscores",
  ).min(2).max(30),
  password: z.string().min(8).max(30),
});

export function AccountDetails({ initialAccountDetails }: { initialAccountDetails: VUser }) {
  return (
    <div className="mt-4 space-y-12">
      <UserDetailsForm initialUserDetails={initialAccountDetails} />
      <LoginDetailsForm initialUsername={initialAccountDetails.username || ""} />
    </div >
  )
}

function UserDetailsForm({ initialUserDetails }: { initialUserDetails: VUser }) {
  const form = useForm<z.infer<typeof userDetailsFormSchema>>({
    resolver: zodResolver(userDetailsFormSchema),
    defaultValues: initialUserDetails,
  });
  async function onSubmit(values: z.infer<typeof userDetailsFormSchema>) {
    if (!form.formState.isDirty) {
      return;
    }
    updateUser({ id: initialUserDetails.id, user: values });
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
          <div className="grid grid-cols-3">
            <Button type="submit" disabled={!form.formState.isDirty} className="col-start-2 col-span-2">Update</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

function LoginDetailsForm({ initialUsername }: { initialUsername: string }) {
  const form = useForm<z.infer<typeof loginDetailsFormSchema>>({
    resolver: zodResolver(userDetailsFormSchema),
    defaultValues: { username: initialUsername, password: "**********" },
  });
  return (
    <div>
      <h2 className="text-xl mb-6">Login Details</h2>
      <Form {...form}>
        <form className="space-y-6">
          <FormField control={form.control} name="username" render={({ field }) => (
            <AccountFormItem>
              <AccountFormLabel>Username</AccountFormLabel>
              <AccountFormInputControl>
                <Input disabled {...field} />
              </AccountFormInputControl>
              <AccountFormMessage />
            </AccountFormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <AccountFormItem>
              <AccountFormLabel>Password</AccountFormLabel>
              <AccountFormInputControl>
                <Input type="password" disabled {...field} />
              </AccountFormInputControl>
              <AccountFormMessage />
            </AccountFormItem>
          )} />
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