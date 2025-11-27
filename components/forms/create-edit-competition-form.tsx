"use client";

import { AlertTriangle, Trophy, Calendar, CalendarClock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { createCompetition, updateCompetition } from "@/lib/db_actions";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
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

const formSchema = z
  .object({
    name: z.string().min(8).max(1000),
    forecasts_open_date: z.date(),
    forecasts_close_date: z.date(),
    end_date: z.date(),
  })
  .superRefine((values, ctx) => {
    const { forecasts_open_date, forecasts_close_date, end_date } = values;

    if (forecasts_open_date >= forecasts_close_date) {
      ctx.addIssue({
        code: "custom",
        message: "Open date must be before close date",
        path: ["forecasts_open_date"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Close date must be after open date",
        path: ["forecasts_close_date"],
      });
    }

    if (forecasts_close_date >= end_date) {
      ctx.addIssue({
        code: "custom",
        message: "Close date must be before end date",
        path: ["forecasts_close_date"],
      });
      ctx.addIssue({
        code: "custom",
        message: "End date must be after close date",
        path: ["end_date"],
      });
    }
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialCompetition?.name || "",
      forecasts_open_date: initialCompetition?.forecasts_open_date,
      forecasts_close_date: initialCompetition?.forecasts_close_date,
      end_date: initialCompetition?.end_date,
    },
  });

  const createCompetitionAction = useServerAction(createCompetition, {
    successMessage: "Competition Created!",
    onSuccess: () => {
      if (onSubmit) {
        onSubmit();
      }
    },
  });

  const updateCompetitionAction = useServerAction(updateCompetition, {
    successMessage: "Competition Updated!",
    onSuccess: () => {
      if (onSubmit) {
        onSubmit();
      }
    },
  });

  const isLoading =
    createCompetitionAction.isLoading || updateCompetitionAction.isLoading;
  const error = createCompetitionAction.error || updateCompetitionAction.error;

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    if (initialCompetition) {
      await updateCompetitionAction.execute({
        id: initialCompetition.id,
        competition: values,
      });
    } else {
      await createCompetitionAction.execute({
        competition: values,
      });
    }
  }
  if (isLoading) {
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
          disabled={isLoading}
          className="w-full h-11 text-base font-medium"
        >
          {isLoading ? (
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
