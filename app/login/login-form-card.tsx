"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { login, LoginResponse } from "@/lib/auth";

const formSchema = z.object({
  username: z.string().regex(
    /^[a-z0-9_]+$/,
    "Must contain only lowercase letters, numbers, or underscores",
  ).min(2).max(30),
  password: z.string().min(8).max(30),
});

export default function LoginFormCard(
  { onLogin }: { onLogin?: () => void },
) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { mutate } = useCurrentUser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const response = await login({
      username: values.username,
      password: values.password,
    }).catch((error) => {
      const message = error instanceof Error
        ? error.message
        : "An error occurred";
      return { success: false, error: message } as LoginResponse;
    });
    mutate();
    if (!response.success) {
      setError(response.error);
    } else {
      setError("");
      onLogin && onLogin();
    }
    setLoading(false);
  }
  return (
    <Card className="w-full max-w-md mx-4">
      <CardHeader>
        <CardTitle className="text-xl">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="bobbytables"
                      autoCapitalize="none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="correct-horse-battery-staple"
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
                  Login
                </Button>
              )}
            {error && (
              <Alert
                variant="destructive"
                className="m-4 w-auto flex flex-row justify-start items-center"
              >
                <AlertTriangle className="h-8 w-8 mr-4 inline" />
                <div className="ml-4">
                  <AlertTitle>Login Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </div>
              </Alert>
            )}
          </form>
          <div className="mt-4 flex flex-col gap-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Forgot your credentials?
              <Link href="/reset-password">
                <Button variant="link">
                  Reset password
                </Button>
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?<br />
              You&apos;ll need an invite link from Ethan.
            </p>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
