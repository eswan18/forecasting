"use client";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewForecast, VProp } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createForecast } from "@/lib/db_actions";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  forecast: z.coerce.number({ message: "You must choose a number" }).min(0).max(
    1,
  ),
});

export function RecordForecastForm({ prop }: { prop: VProp }) {
  const { user } = useCurrentUser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const { toast } = useToast();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const forecast: NewForecast = {
      prop_id: prop.prop_id,
      user_id: user!.id,
      forecast: values.forecast,
    };
    try {
      await createForecast({ forecast }).then(() => {
        toast({ title: "Forecast recorded!" });
      });
    } catch (e) {
      const msg = (e instanceof Error) ? e.message : "An error occurred";
      toast({
        title: "Error recording forecast",
        description: msg,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-6 grid-flow-col content-end gap-y-2 gap-x-1">
          <div className="col-span-4 text-sm mr-2 flex flex-col">
            <span>{prop.prop_text}</span>
            <span className="text-muted-foreground italic">
              {prop.prop_notes}
            </span>
          </div>
          <FormField
            control={form.control}
            name="forecast"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    inputMode="decimal"
                    step="any"
                    {...field}
                    // Interesting, this makes the input uncontrolled and suppresses a
                    // warning, but doesn't seem to break the form's behavior.
                    value={undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            disabled={form.formState.isDirty ? undefined : true}
          >
            <Check size={16} />
          </Button>
        </div>
      </form>
    </Form>
  );
}
