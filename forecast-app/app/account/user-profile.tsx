"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VUser } from "@/types/db_types";
import { z } from "zod";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().regex(
    /^[a-zA-Z \-]+$/,
    "Must contain only letters, hyphens, and spaces",
  ).min(2).max(30),
  email: z.string().email(),
});

export function UserProfile({ initialUserDetails }: { initialUserDetails: VUser }) {
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialUserDetails,
  });
  const labelClasses = "h-9 w-full py-1 flex flex-row items-center text-base justify-end";
  return (
    <div className="mt-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => console.log(values))} className="space-y-6">
          <GridFormItem>
            <Label className={labelClasses}>Username</Label>
            <Input disabled value={initialUserDetails.username || undefined} />
          </GridFormItem>
          <GridFormItem>
            <Label className={labelClasses}>Password</Label>
            <Input disabled type="password" value="*********" />
          </GridFormItem>
          <FormField control={form.control} name="name" render={({ field }) => (
            <GridFormItem>
              <FormLabel className={labelClasses}>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </GridFormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <GridFormItem>
              <FormLabel className={labelClasses}>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </GridFormItem>
          )} />
          <GridFormItem>
            <div /><Button type="submit" disabled={!form.formState.isDirty}>Update</Button>
          </GridFormItem>
        </form>
      </Form>
    </div >
  )
}

function GridFormItem({ children }: { children: React.ReactNode }) {
  return <FormItem className="grid grid-cols-2 w-full gap-4 space-y-0">{children}</FormItem>
}