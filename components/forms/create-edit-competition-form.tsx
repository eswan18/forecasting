"use client";

import { useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
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
  forecasts_due_date: z.date(),
  end_date: z.date(),
});

/*
 * Form for creating or editing a competition..
 * If initialCompetition is provided, the form will be in edit mode, otherwise in create mode.
 */
export function CreateEditCompetitionForm(
  { initialCompetition, onSubmit }: {
    initialCompetition?: Competition;
    onSubmit?: () => void;
  },
) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialCompetition?.name || "",
      forecasts_due_date: initialCompetition?.forecasts_due_date,
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
          competition: { ...values },
        }).then(() => {
          toast({
            title: "Competition Updated!",
          });
        });
      } else {
        await createCompetition({ competition: values }).then(() => {
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
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="forecasts_due_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Forecasts Due</FormLabel>
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
            <FormItem className="flex flex-col">
              <FormLabel>Competition End</FormLabel>
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
        {loading
          ? (
            <Button type="submit" disabled className="w-full">
              <LoaderCircle className="animate-spin" />
            </Button>
          )
          : (
            <Button type="submit" className="w-full">
              {initialCompetition ? "Update" : "Create"}
            </Button>
          )}
        {error && (
          <Alert
            variant="destructive"
            className="m-4 w-auto flex flex-row justify-start items-center"
          >
            <AlertTriangle className="h-8 w-8 mr-4 inline" />
            <div className="ml-4">
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}
      </form>
    </Form>
  );
}
