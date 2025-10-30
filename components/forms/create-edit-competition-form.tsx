"use client";

import { useState } from "react";
import { AlertTriangle, Trophy, Calendar, CalendarClock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { createCompetition, updateCompetition } from "@/lib/db_actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Competition } from "@/types/db_types";
import { Input } from "@/components/ui/input";
import DatePicker from "../ui/date-picker";

const formSchema = z.object({
  name: z.string().min(8).max(1000),
  forecasts_open_date: z.date(),
  forecasts_close_date: z.date(),
  end_date: z.date(),
});

/*
 * Form for creating or editing a competition..
 * If initialCompetition is provided, the form will be in edit mode, otherwise in create mode.
 */
export function CreateEditCompetitionForm({
  initialCompetition,
  onSubmit,
}: {
  initialCompetition?: Competition;
  onSubmit?: () => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialCompetition?.name || "",
      forecasts_open_date: initialCompetition?.forecasts_open_date ?? undefined,
      forecasts_close_date: initialCompetition?.forecasts_close_date,
      end_date: initialCompetition?.end_date,
    },
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setError("");
    setLoading(true);
    try {
      if (initialCompetition) {
        await updateCompetition({
          id: initialCompetition.id,
          competition: { ...values, visible: initialCompetition.visible },
        }).then(() => {
          toast({
            title: "Competition Updated!",
          });
        });
      } else {
        await createCompetition({
          competition: { ...values, visible: true },
        }).then(() => {
          toast({
            title: "Competition Created!",
          });
        });
      }
    } catch (e) {
      const title = initialCompetition ? "Update Error" : "Create Error";
      if (e instanceof Error) {
        toast({
          title,
          description: e.message,
          variant: "destructive",
        });
        setError(e.message);
      } else {
        toast({
          title,
          description: "An error occurred.",
          variant: "destructive",
        });
        setError("An error occurred.");
      }
    } finally {
      setLoading(false);
    }
    if (onSubmit) {
      onSubmit();
    }
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner />
      </div>
    );
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Competition Name
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-11"
                  placeholder="Enter competition name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="forecasts_open_date"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Forecasts Open Date
              </FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  timeZone="UTC"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="forecasts_close_date"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Forecasts Due Date
              </FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  timeZone="UTC"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Competition End Date
              </FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  timeZone="UTC"
                />
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
              {initialCompetition ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              {initialCompetition ? "Update Competition" : "Create Competition"}
            </>
          )}
        </Button>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Submission failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </Form>
  );
}
