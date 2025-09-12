"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { z } from "zod";
import { createSuggestedProp } from "@/lib/db_actions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
const formSchema = z.object({
  propText: z
    .string()
    .min(8)
    .max(500, "Prop text must be between 8 and 500 characters"),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

export function SuggestPropForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propText: "",
      notes: "",
    },
  });
  const { user } = useCurrentUser();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Combine prop text and notes for now (until we add a separate notes field to the DB)
      const combinedText = values.notes
        ? `${values.propText}\n\nNotes: ${values.notes}`
        : values.propText;

      const prop = { prop: combinedText, suggester_user_id: user.id };
      createSuggestedProp({ prop });
      form.reset({ propText: "", notes: "" });
      toast({
        title: "Proposition submitted",
        description: "Your proposition has been submitted for review.",
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Submission Error",
          description: error.message,
          variant: "destructive",
        });
        setError(error.message);
      } else {
        toast({
          title: "Submission Error",
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl sm:text-2xl font-semibold">
          Suggest a Proposition
        </CardTitle>
        <p className="text-sm sm:text-base text-muted-foreground">
          Submit a new proposition for consideration in forecasting competitions
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="propText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base font-medium">
                    Prop Text
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter the proposition text here. Be clear and specific about what you're asking people to forecast."
                      className="min-h-[120px] resize-none text-sm sm:text-base"
                      rows={5}
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
                <FormItem>
                  <FormLabel className="text-sm sm:text-base font-medium">
                    Additional Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any additional context, clarification, or background information that might be helpful for reviewers."
                      className="min-h-[80px] resize-none text-sm sm:text-base"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {loading ? (
                <Button
                  type="submit"
                  disabled
                  className="flex-1 text-sm sm:text-base"
                >
                  <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
                  Submitting...
                </Button>
              ) : (
                <Button type="submit" className="flex-1 text-sm sm:text-base">
                  Submit Proposition
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
