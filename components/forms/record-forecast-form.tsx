"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Forecast, ForecastUpdate, NewForecast, VProp } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import { Check, LoaderCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createForecast, updateForecast } from "@/lib/db_actions";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  forecast: z.number({ message: "You must choose a number" }).min(0).max(1),
});

export function RecordForecastForm(
  { prop, initialForecast }: { prop: VProp; initialForecast?: Forecast },
) {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { forecast: initialForecast?.forecast ?? 0 },
  });
  const { toast } = useToast();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    if (!initialForecast) {
      // If there was no initial forecast, we're creating a new one.
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
      } finally {
        setLoading(false);
      }
    } else {
      // If there was an initial forecast, we're updating it.
      const forecast: ForecastUpdate = {
        forecast: values.forecast,
      };
      try {
        await updateForecast({ id: initialForecast.id, forecast }).then(() => {
          toast({ title: "Forecast updated!" });
        });
      } catch (e) {
        const msg = (e instanceof Error) ? e.message : "An error occurred";
        toast({
          title: "Error updating forecast",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-6 grid-flow-col content-end gap-y-2 gap-x-1">
          <div className="col-span-4 mr-2 flex flex-col">
            <span className="text-sm">{prop.prop_text}</span>
            {prop.prop_notes &&
              (
                <span className="text-muted-foreground italic break-words text-xs mt-1">
                  {prop.prop_notes}
                </span>
              )}
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
                    // Interestingly, this makes the input uncontrolled and suppresses a
                    // warning, but doesn't seem to break the form's behavior.
                    value={undefined}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {loading
            ? (
              <Button variant="outline" disabled size="icon">
                <LoaderCircle className="animate-spin" />
              </Button>
            )
            : (
              <Button
                type="submit"
                variant="outline"
                size="icon"
                disabled={form.formState.isDirty ? undefined : true}
              >
                <Check size={16} />
              </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
