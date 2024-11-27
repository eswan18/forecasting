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
import { login } from "@/lib/login";

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
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    login({ username: values.username, password: values.password }).then(() => {
      mutate();
      onLogin && onLogin();
    }).catch((error) => {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred.");
      }
    }).finally(() => {
      setLoading(false);
    });
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
                      autoCapitalize="off"
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
          <div className="mt-4">
            <p className="text-center text-sm text-muted-foreground">
              Forgot your credentials?{" "}
              <Link href="/reset-password">
                <Button variant="link">
                  Reset password
                </Button>
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register">
                <Button variant="link">
                  Register
                </Button>
              </Link>
            </p>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
