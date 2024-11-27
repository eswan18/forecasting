"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { executePasswordReset } from "@/lib/db_actions";
import { LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  password: z.string().min(8).max(30),
});

export default function ResetPasswordFormCard(
  { username, token }: { username: string; token: string },
) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const { toast } = useToast();
  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    executePasswordReset({ username, token, password: values.password }).then(
      () => {
        setError("");
        toast({
          title: "Password Reset",
          description: "Your password has been reset. You can now log in.",
        })
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      },
    ).catch((e) => {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An error occurred");
      }
      setLoading(false);
    });
  }
  return (
    <Card className="w-full max-w-md mx-4">
      <CardHeader>
        <CardTitle className="text-xl">Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input disabled value={username} />
              </FormControl>
              <FormMessage />
            </FormItem>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="correct-horse-battery-staple"
                      autoCapitalize="off"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {loading
              ? (
                <div className="w-full flex justify-center">
                  <LoaderCircle className="animate-spin" />
                </div>
              )
              : (
                <Button type="submit" className="w-full">
                  Reset Password
                </Button>
              )}
            {error && (
              <Alert
                variant="destructive"
                className="m-4 w-auto flex flex-row justify-start items-center"
              >
                <AlertTriangle className="h-8 w-8 mr-4 inline" />
                <div className="ml-4">
                  <AlertTitle>Error</AlertTitle>
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
