"use client";

import { useState } from "react";
import { redirect, useRouter } from "next/navigation";
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
  prop: z.string().min(8).max(100),
});

export function SuggestPropForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prop: "" },
  });
  const { user } = useCurrentUser();
  if (!user) {
    redirect("/login");
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError("");
    try {
      const prop = { prop: values.prop, suggester_user_id: user!.id };
      createSuggestedProp({ prop });
      form.reset({ prop: "" });
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Suggest Prop</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="prop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposition</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Type your prop here." />
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
                  Suggest
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
      </CardContent>
    </Card>
  );
}
