"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  FileText,
  Hash,
  Tag,
  CalendarClock,
  Calendar,
  Eye,
  EyeOff,
  Lightbulb,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Spinner } from "@/components/ui/spinner";
import { useServerAction } from "@/hooks/use-server-action";
import { getBrowserTimezone } from "@/hooks/getBrowserTimezone";
import { createProp } from "@/lib/db_actions";
import { formatDate } from "@/lib/time-utils";
import type { Category } from "@/types/db_types";

const formSchema = z
  .object({
    text: z
      .string()
      .min(8, "Proposition must be at least 8 characters")
      .max(300, "Proposition must be at most 300 characters"),
    notes: z
      .string()
      .max(1000, "Notes must be at most 1000 characters")
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    category_id: z.number().nullable(),
    forecasts_due_date: z.date({
      message: "Forecast deadline is required",
    }),
    resolution_due_date: z.date({
      message: "Resolution deadline is required",
    }),
  })
  .refine(
    (data) => data.forecasts_due_date > new Date(),
    {
      message: "Forecast deadline must be in the future",
      path: ["forecasts_due_date"],
    },
  )
  .refine(
    (data) => data.resolution_due_date > new Date(),
    {
      message: "Resolution deadline must be in the future",
      path: ["resolution_due_date"],
    },
  )
  .refine(
    (data) => data.resolution_due_date > data.forecasts_due_date,
    {
      message: "Resolution deadline must be after forecast deadline",
      path: ["resolution_due_date"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

interface NewPropFormProps {
  competitionId: number;
  competitionName: string;
  categories: Category[];
  userId: number;
}

export function NewPropForm({
  competitionId,
  competitionName,
  categories,
  userId,
}: NewPropFormProps) {
  const router = useRouter();
  const timezone = getBrowserTimezone();
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      notes: null,
      category_id: null,
      forecasts_due_date: undefined,
      resolution_due_date: undefined,
    },
  });

  const createPropAction = useServerAction(createProp, {
    successMessage: "Proposition Created!",
    onSuccess: () => {
      router.push(`/competitions/${competitionId}`);
    },
  });

  async function handleSubmit(values: FormValues) {
    await createPropAction.execute({
      prop: {
        text: values.text,
        notes: values.notes,
        category_id: values.category_id,
        competition_id: competitionId,
        user_id: null, // Competition props are not personal
        forecasts_due_date: values.forecasts_due_date,
        resolution_due_date: values.resolution_due_date,
        created_by_user_id: userId,
      },
    });
  }

  const watchedText = form.watch("text");
  const watchedNotes = form.watch("notes");
  const watchedForecastsDueDate = form.watch("forecasts_due_date");

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Proposition Text */}
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Proposition
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-24 resize-none"
                    placeholder="e.g., Will the new product launch before March 2025?"
                    maxLength={300}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <FormDescription>
                    Write a clear yes/no question. Markdown supported.
                  </FormDescription>
                  <span className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/300
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Notes
                  <span className="text-xs text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    className="min-h-20 resize-none"
                    placeholder="Add context, resolution criteria, or background information..."
                    maxLength={1000}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <FormDescription>
                    Clarify resolution criteria or add context. Markdown supported.
                  </FormDescription>
                  <span className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/1000
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category
                  <span className="text-xs text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </FormLabel>
                <Select
                  value={field.value === null ? "null" : String(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value === "null" ? null : Number(value))
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Deadlines Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Forecast Deadline */}
            <FormField
              control={form.control}
              name="forecasts_due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Forecast Deadline
                  </FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      timeZone="UTC"
                      placeholder="When forecasts are due"
                    />
                  </FormControl>
                  <FormDescription>
                    Last day members can submit forecasts
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resolution Deadline */}
            <FormField
              control={form.control}
              name="resolution_due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Resolution Deadline
                  </FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      timeZone="UTC"
                      placeholder="When prop will be resolved"
                    />
                  </FormControl>
                  <FormDescription>
                    When this proposition should be resolved
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Preview Toggle */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-muted-foreground"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Preview
                </>
              )}
            </Button>
          </div>

          {/* Preview Card */}
          {showPreview && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">Preview</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    {watchedText || (
                      <span className="text-muted-foreground italic">
                        No proposition text yet...
                      </span>
                    )}
                  </p>
                  {watchedNotes && (
                    <p className="text-xs text-muted-foreground border-l-2 pl-2">
                      {watchedNotes}
                    </p>
                  )}
                  {watchedForecastsDueDate && (
                    <p className="text-xs text-muted-foreground">
                      Forecasts due:{" "}
                      {formatDate(watchedForecastsDueDate, timezone)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Tips for good propositions:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Frame as a clear yes/no question</li>
                  <li>Include specific dates or metrics when possible</li>
                  <li>Define resolution criteria in the notes</li>
                  <li>
                    Set forecast deadline before the event could reasonably occur
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {createPropAction.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{createPropAction.error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/competitions/${competitionId}`)}
              disabled={createPropAction.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPropAction.isLoading}
              className="flex-1"
            >
              {createPropAction.isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create Proposition"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
