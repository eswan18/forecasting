"use client";

import { useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProp } from "@/lib/db_actions";
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

const formSchema = z.object({
  prop_text: z.string().min(8).max(1000),
});

/*
 * Form for creating or editing a prop.
 * If initialProp is provided, the form will be in edit mode, otherwise in create mode.
 */
export function CreateEditPropForm({ initialProp }: { initialProp?: VProp }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prop_text: initialProp?.prop_text },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError("");
    setLoading(true);
    try {
      if (initialProp) {
        // If initialProp was set, we're editing an existing prop.
        await updateProp({
          id: initialProp.prop_id,
          prop: { text: values.prop_text },
        }).then(() => {
          toast({
            title: "Prop Updated!",
          });
        });
      } else {
        // If initialProp wasn't set, we're creating a new prop.
        // TODO
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
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="prop_text"
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
        {loading
          ? (
            <Button type="submit" disabled className="w-full">
              <LoaderCircle className="animate-spin" />
            </Button>
          )
          : (
            <Button type="submit" className="w-full">
              Update
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
