"use client";

import {
  AlertTriangle,
  Trophy,
  Calendar,
  CalendarClock,
  Lock,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { createCompetition, updateCompetition } from "@/lib/db_actions";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Competition } from "@/types/db_types";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import DatePicker from "../ui/date-picker";
import { competitionFormSchema } from "./competition-form-schema";

type EditableCompetition = Pick<
  Competition,
  "id" | "name" | "is_private" | "forecasts_open_date" | "forecasts_close_date" | "end_date"
>;

/*
 * Form for creating or editing a competition..
 * If initialCompetition is provided, the form will be in edit mode, otherwise in create mode.
 */
export function CreateEditCompetitionForm({
  initialCompetition,
  onSubmit,
}: {
  initialCompetition?: EditableCompetition;
  onSubmit?: () => void;
}) {
  const form = useForm<z.infer<typeof competitionFormSchema>>({
    resolver: zodResolver(competitionFormSchema),
    defaultValues: {
      name: initialCompetition?.name || "",
      is_private: initialCompetition?.is_private ?? false,
      // Convert null to undefined for form compatibility
      forecasts_open_date: initialCompetition?.forecasts_open_date ?? undefined,
      forecasts_close_date:
        initialCompetition?.forecasts_close_date ?? undefined,
      end_date: initialCompetition?.end_date ?? undefined,
    },
  });

  const isPrivate = form.watch("is_private");

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

  async function handleSubmit(values: z.infer<typeof competitionFormSchema>) {
    // Build the competition object explicitly to ensure proper values
    const competition = {
      name: values.name,
      is_private: values.is_private,
      // For private competitions, dates should be null/undefined
      // For public competitions, dates are required
      forecasts_open_date: values.is_private ? null : values.forecasts_open_date,
      forecasts_close_date: values.is_private
        ? null
        : values.forecasts_close_date,
      end_date: values.is_private ? null : values.end_date,
    };

    if (initialCompetition) {
      await updateCompetitionAction.execute({
        id: initialCompetition.id,
        competition,
      });
    } else {
      await createCompetitionAction.execute({
        competition,
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
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!initialCompetition && (
          <FormField
            control={form.control}
            name="is_private"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private Competition
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Only invited members can view and participate. Deadlines are
                    set per-prop instead of competition-wide.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        {!isPrivate && (
          <div className="space-y-6">
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
          </div>
        )}
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
