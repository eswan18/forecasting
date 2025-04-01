"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createProp,
  getCategories,
  getCompetitions,
  updateProp,
} from "@/lib/db_actions";
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
import { Category, Competition, VProp } from "@/types/db_types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUserFromCookies } from "@/lib/get-user";

const formSchema = z.object({
  text: z.string().min(8).max(1000),
  notes: z.preprocess(
    (arg) => (arg === "" ? null : arg),
    z.string().max(1000).nullable().optional(),
  ),
  category_id: z.coerce.string().transform(
    (value) => (value === "null" ? null : parseInt(value, 10)),
  ).nullable(),
  competition_id: z.coerce.string().transform(
    (value) => (value === "null" ? null : parseInt(value, 10)),
  ).nullable(),
  user_id: z.coerce.string().transform(
    (value) => (value === "null" ? null : parseInt(value, 10)),
  ).nullable(),
}).refine(
  (data) => data.competition_id === null || data.user_id === null,
  {
    message: "Props associated with a competition must be public.",
    path: ["user_id"],
  },
).refine(
  (data) => !(data.user_id === null && data.category_id === null),
  {
    message: "Public props must have a category",
    path: ["category_id"],
  },
);

/*
 * Form for creating or editing a prop.
 * If initialProp is provided, the form will be in edit mode, otherwise in create mode.
 */
export function CreateEditPropForm(
  { initialProp, defaultUserId, defaultCompetitionId, onSubmit }: {
    initialProp?: VProp;
    defaultUserId?: number;
    defaultCompetitionId?: number;
    onSubmit?: () => void;
  },
) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [canEditPublicProps, setCanEditPublicProps] = useState(false);
  const { toast } = useToast();
  const initialUserId = initialProp?.prop_user_id || defaultUserId;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: initialProp?.prop_text,
      notes: initialProp?.prop_notes || undefined,
      category_id: initialProp?.category_id || null,
      competition_id: defaultCompetitionId ?? initialProp?.competition_id ??
        null,
      user_id: initialUserId ?? null,
    },
  });
  useEffect(() => {
    getCategories().then(async (categories) => {
      setCategories(categories);
      const competitions = await getCompetitions();
      setCompetitions(competitions);
      setLoading(false);
    });
    getUserFromCookies().then((user) => {
      if (user && user.is_admin) {
        setCanEditPublicProps(true); // Admins can edit public props
      }
    });
  }, []);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setError("");
    setLoading(true);
    try {
      if (initialProp) {
        await updateProp({
          id: initialProp.prop_id,
          prop: { ...values },
        }).then(() => {
          toast({
            title: "Prop Updated!",
          });
        });
      } else {
        await createProp({ prop: values }).then(() => {
          toast({
            title: "Prop Created!",
          });
        });
      }
    } catch (e) {
      const title = initialProp ? "Update Error" : "Create Error";
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
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prop</FormLabel>
              <FormControl>
                <Textarea {...field} className="text-sm min-h-20" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? undefined}
                  className="text-sm min-h-20"
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
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  {...field}
                  value={field.value ? field.value.toString() : "null"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">
                      None
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
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
              <FormItem>
                <FormLabel>Competition</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  {...field}
                  value={field.value ? field.value.toString() : "null"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a competition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    {competitions.map((competition) => (
                      <SelectItem
                        key={competition.id}
                        value={competition.id.toString()}
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
              <FormItem>
                <FormLabel>Public/Personal</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  {...field}
                  value={field.value ? field.value.toString() : "null"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {initialUserId &&
                      (
                        <SelectItem value={initialUserId.toString()}>
                          Personal
                        </SelectItem>
                      )}
                    {canEditPublicProps && (
                      <SelectItem value="null">
                        Public
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        {loading
          ? (
            <Button type="submit" disabled className="w-full">
              <LoaderCircle className="animate-spin" />
            </Button>
          )
          : (
            <Button type="submit" className="w-full">
              {initialProp ? "Update" : "Create"}
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
