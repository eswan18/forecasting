"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useServerAction } from "@/hooks/use-server-action";
import {
  createProp,
  getCategories,
  getCompetitions,
  updateProp,
} from "@/lib/db_actions";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Category, Competition, VProp } from "@/types/db_types";
import { getUserFromCookies } from "@/lib/get-user";
import { PropFormFields } from "./prop-form-fields";

export const propFormSchema = z
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

export type PropFormValues = z.infer<typeof propFormSchema>;

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
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [canEditPublicProps, setCanEditPublicProps] = useState(false);
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

  const form = useForm<PropFormValues>({
    resolver: zodResolver(propFormSchema),
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
    getCategories().then(async (categoriesResult) => {
      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }
      const competitionsResult = await getCompetitions();
      if (competitionsResult.success) {
        setCompetitions(competitionsResult.data);
      }
      setLoading(false);
    });
    getUserFromCookies().then((user) => {
      if (user && user.is_admin) {
        setCanEditPublicProps(true); // Admins can edit public props
      }
    });
  }, []);

  async function handleSubmit(values: PropFormValues) {
    if (initialProp) {
      await updatePropAction.execute({
        id: initialProp.prop_id,
        prop: { ...values },
      });
    } else {
      await createPropAction.execute({ prop: values });
    }
  }

  if (loading || createPropAction.isLoading || updatePropAction.isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <PropFormFields
          form={form}
          categories={categories}
          competitions={competitions}
          initialUserId={initialUserId}
          canEditPublicProps={canEditPublicProps}
        />

        <Button
          type="submit"
          disabled={createPropAction.isLoading || updatePropAction.isLoading}
          className="w-full h-11 text-base font-medium"
        >
          {createPropAction.isLoading || updatePropAction.isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
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
