"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateUser } from "@/lib/db_actions/users";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { TIMEZONES, DEFAULT_TIMEZONE } from "@/lib/timezones";

const formSchema = z.object({
  timezone: z.string().min(1, "Please select a timezone"),
});

type FormValues = z.infer<typeof formSchema>;

export function TimezoneSettings() {
  const { user, mutate } = useCurrentUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timezone: user?.timezone ?? DEFAULT_TIMEZONE,
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const result = await updateUser({
        id: user.id,
        user: { timezone: values.timezone },
      });

      if (result.success) {
        toast({
          title: "Timezone updated",
          description: "Your timezone preference has been saved.",
        });
        mutate(); // Refresh user data
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Timezone</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Timezone</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  All dates and times will be displayed in this timezone.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
