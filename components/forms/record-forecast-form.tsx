"use client";

import { useState } from "react";
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
import { Forecast, ForecastUpdate, NewForecast, VProp } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createForecast, updateForecast } from "@/lib/db_actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  forecast: z.number({ message: "You must choose a number" }).min(0).max(1),
});

export function RecordForecastForm({
  prop,
  initialForecast,
  onSuccess,
}: {
  prop: VProp;
  initialForecast?: Forecast;
  onSuccess?: () => void;
}) {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { forecast: initialForecast?.forecast ?? 0.5 },
  });
  const { toast } = useToast();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);

    if (!initialForecast) {
      // Creating a new forecast
      const forecast: NewForecast = {
        prop_id: prop.prop_id,
        user_id: user!.id,
        forecast: values.forecast,
      };
      const result = await createForecast({ forecast });
      if (result.success) {
        toast({ title: "Forecast recorded!" });
        onSuccess?.();
      } else {
        setError(result.error);
      }
    } else {
      // Updating existing forecast
      const forecast: ForecastUpdate = {
        forecast: values.forecast,
      };
      const result = await updateForecast({
        id: initialForecast.id,
        forecast,
      });
      if (result.success) {
        toast({ title: "Forecast updated!" });
        onSuccess?.();
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="forecast"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Forecast Probability
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step="0.01"
                    className="h-11 text-base"
                    placeholder="0.50"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                  <div className="text-xs text-muted-foreground">
                    Enter a probability between 0.00 and 1.00
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 text-base font-medium"
        >
          {loading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              {initialForecast ? "Updating..." : "Recording..."}
            </>
          ) : (
            <>{initialForecast ? "Update Forecast" : "Record Forecast"}</>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </Form>
  );
}
