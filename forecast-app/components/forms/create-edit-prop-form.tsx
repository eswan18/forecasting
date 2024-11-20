"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createProp,
  getCategories,
  getPropYears,
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
import { Category, VProp } from "@/types/db_types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  text: z.string().min(8).max(1000),
  category_id: z.coerce.number(),
  year: z.coerce.number(),
});

/*
 * Form for creating or editing a prop.
 * If initialProp is provided, the form will be in edit mode, otherwise in create mode.
 */
export function CreateEditPropForm(
  { initialProp }: { initialProp?: VProp },
) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: initialProp?.prop_text,
      category_id: initialProp?.category_id,
      year: initialProp?.year,
    },
  });

  useEffect(() => {
    getCategories().then(async (categories) => {
      setCategories(categories);
      const years = await getPropYears();
      years.unshift(years[0] + 1);
      setYears(years);
      setLoading(false);
    });
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError("");
    setLoading(true);
    try {
      if (initialProp) {
        // If initialProp was set, we're editing an existing prop.
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          name="category_id"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  {...field}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
          name="year"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  {...field}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem
                        key={year}
                        value={year.toString()}
                      >
                        {year}
                      </SelectItem>
                    ))}
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
