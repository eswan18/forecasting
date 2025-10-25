"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ForecastUpdate, NewForecast, VForecast } from "@/types/db_types";
import { createForecast, updateForecast } from "@/lib/db_actions";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { Save } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  forecast: z
    .string()
    .min(1, "You must enter a forecast")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 1;
    }, "Forecast must be a valid number between 0 and 1"),
});

export default function ForecastFieldForm({
  propId,
  userId,
  initialForecast,
}: {
  propId: number;
  userId: number;
  initialForecast?: VForecast;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { forecast: initialForecast?.forecast?.toString() ?? "" },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    // Convert string to number for the API calls
    const forecastValue = parseFloat(values.forecast);

    if (!initialForecast) {
      // If there was no initial forecast, we're creating a new one.
      const forecast: NewForecast = {
        prop_id: propId,
        user_id: userId,
        forecast: forecastValue,
      };
      try {
        await createForecast({ forecast }).then(() => {
          toast({ title: "Forecast recorded!" });
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "An error occurred";
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
        forecast: forecastValue,
      };
      try {
        await updateForecast({
          id: initialForecast.forecast_id,
          forecast,
        }).then(() => {
          toast({ title: "Forecast updated!" });
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "An error occurred";
        toast({
          title: "Error updating forecast",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="forecast"
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row gap-2 items-center justify-start">
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    {...field}
                    onChange={(e) => {
                      // Keep the raw string value so user can type decimals
                      field.onChange(e.target.value);
                    }}
                    className="w-14"
                  />
                </FormControl>
                {loading ? (
                  <Button variant="outline" disabled size="icon">
                    <Spinner />
                  </Button>
                ) : form.formState.isDirty ? (
                  <Button type="submit" size="icon">
                    <Save size={16} />
                  </Button>
                ) : null}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
