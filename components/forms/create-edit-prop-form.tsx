"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  LoaderCircle,
  FileText,
  Tag,
  Trophy,
  Users,
  Hash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useServerAction } from "@/hooks/use-server-action";
import { createProp, updateProp } from "@/lib/db_actions";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VProp } from "@/types/db_types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCategories } from "@/hooks/useCategories";
import { useCompetitions } from "@/hooks/useCompetitions";

const formSchema = z
  .object({
    text: z.string().min(8).max(1000),
    notes: z
      .string()
      .max(1000)
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    category_id: z.number().nullable(),
    competition_id: z.number().nullable(),
    user_id: z.number().nullable(),
  })
  .refine((data) => data.competition_id === null || data.user_id === null, {
    message: "Props associated with a competition must be public.",
    path: ["user_id"],
  })
  .refine((data) => !(data.user_id === null && data.category_id === null), {
    message: "Public props must have a category",
    path: ["category_id"],
  });

/*
 * Form for creating or editing a prop.
 * If initialProp is provided, the form will be in edit mode, otherwise in create mode.
 */
export function CreateEditPropForm({
  initialProp,
  defaultUserId,
  defaultCompetitionId,
  onSubmit,
}: {
  initialProp?: VProp;
  defaultUserId?: number;
  defaultCompetitionId?: number | null;
  onSubmit?: () => void;
}) {
  const {
    data: categories,
    error: categoriesError,
    isLoading: categoriesIsLoading,
  } = useCategories();
  const {
    data: competitions,
    error: competitionsError,
    isLoading: competitionsIsLoading,
  } = useCompetitions();
  const { user: currentUser } = useCurrentUser();
  const { toast } = useToast();
  const fetchErrorNotifiedRef = useRef(false);
  const initialUserId = initialProp?.prop_user_id || defaultUserId;

  const createPropAction = useServerAction(createProp, {
    successMessage: "Prop Created!",
    onSuccess: () => {
      if (onSubmit) onSubmit();
    },
  });

  const updatePropAction = useServerAction(updateProp, {
    successMessage: "Prop Updated!",
    onSuccess: () => {
      if (onSubmit) onSubmit();
    },
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: initialProp?.prop_text ?? "",
      notes: initialProp?.prop_notes || null,
      category_id: initialProp?.category_id ?? null,
      competition_id:
        defaultCompetitionId ?? initialProp?.competition_id ?? null,
      user_id: initialUserId ?? null,
    },
  });
  useEffect(() => {
    const currentError = categoriesError ?? competitionsError;

    if (!currentError) {
      fetchErrorNotifiedRef.current = false;
      return;
    }

    if (fetchErrorNotifiedRef.current) {
      return;
    }

    if (
      categoriesError?.status === 401 ||
      competitionsError?.status === 401
    ) {
      toast({
        title: "Unauthorized",
        description: "You must be signed in to manage propositions.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error",
        description: "We couldn&apos;t load supporting data for the form.",
        variant: "destructive",
      });
    }

    fetchErrorNotifiedRef.current = true;
  }, [categoriesError, competitionsError, toast]);

  const canEditPublicProps = currentUser?.is_admin ?? false;

  const isInitialCategoriesLoading =
    categoriesIsLoading && !categories && !categoriesError;
  const isInitialCompetitionsLoading =
    competitionsIsLoading && !competitions && !competitionsError;
  const isOptionsLoading = isInitialCategoriesLoading || isInitialCompetitionsLoading;
  const isUnauthorized =
    categoriesError?.status === 401 || competitionsError?.status === 401;
  const loadError = categoriesError ?? competitionsError;
  const categoryOptions = categories ?? [];
  const competitionOptions = competitions ?? [];

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    if (initialProp) {
      await updatePropAction.execute({
        id: initialProp.prop_id,
        prop: { ...values },
      });
    } else {
      await createPropAction.execute({ prop: values });
    }
  }
  if (isOptionsLoading || createPropAction.isLoading || updatePropAction.isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }
  if (isUnauthorized) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Unauthorized</AlertTitle>
        <AlertDescription>
          You must be signed in to manage propositions.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {loadError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Supporting data unavailable</AlertTitle>
            <AlertDescription>
              We couldn&apos;t load some supporting data for this form. You may need to
              refresh the page.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Proposition Text
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="text-sm min-h-24 resize-none"
                  placeholder="Enter the proposition text here. Be clear and specific about what you're asking people to forecast."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Notes (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? undefined}
                  className="text-sm min-h-20 resize-none"
                  placeholder="Add any additional context, clarification, or background information."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => {
            return (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category
                </FormLabel>
                <Select
                  {...field}
                  value={field.value === null ? "null" : String(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value === "null" ? null : Number(value))
                  }
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="competition_id"
          render={({ field }) => {
            return (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Competition
                </FormLabel>
                <Select
                  {...field}
                  value={field.value === null ? "null" : String(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value === "null" ? null : Number(value))
                  }
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a competition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    {competitionOptions.map((competition) => (
                      <SelectItem
                        key={competition.id}
                        value={String(competition.id)}
                      >
                        {competition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => {
            return (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Visibility
                </FormLabel>
                <Select
                  {...field}
                  value={field.value === null ? "null" : String(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value === "null" ? null : Number(value))
                  }
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {initialUserId && (
                      <SelectItem value={String(initialUserId)}>
                        Personal
                      </SelectItem>
                    )}
                    {canEditPublicProps && (
                      <SelectItem value="null">Public</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <Button
          type="submit"
          disabled={createPropAction.isLoading || updatePropAction.isLoading}
          className="w-full h-11 text-base font-medium"
        >
          {createPropAction.isLoading || updatePropAction.isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              {initialProp ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{initialProp ? "Update Proposition" : "Create Proposition"}</>
          )}
        </Button>
        {(createPropAction.error || updatePropAction.error) && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Submission failed</AlertTitle>
            <AlertDescription>
              {createPropAction.error || updatePropAction.error}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </Form>
  );
}
