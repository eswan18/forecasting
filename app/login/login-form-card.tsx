"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Eye, EyeOff, Lock, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
import { Spinner } from "@/components/ui/spinner";
import { login, LoginResponse } from "@/lib/auth";

const formSchema = z.object({
  username: z
    .string()
    .regex(
      /^[a-z0-9_]+$/,
      "Must contain only lowercase letters, numbers, or underscores",
    )
    .min(2)
    .max(30),
  password: z.string().min(8).max(30),
});

export default function LoginFormCard({ onLogin }: { onLogin?: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      const message =
        error instanceof Error ? error.message : "An error occurred";
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
    <Card className="w-full shadow-xl border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your credentials to access your account
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Username
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Enter your username"
                        autoCapitalize="none"
                        className="pl-10 h-11"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-11"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Authentication failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </Form>

        <div className="space-y-4">
          <Separator />

          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Forgot your password?
              <Link href="/reset-password" className="ml-1">
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm font-normal text-primary hover:underline"
                >
                  Reset it here
                </Button>
              </Link>
            </p>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account? You&apos;ll need an invite link from
                Ethan to register.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
