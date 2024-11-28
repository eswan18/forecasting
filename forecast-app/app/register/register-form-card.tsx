"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, LoaderCircle } from "lucide-react";

import { z } from "zod";
import { registerNewUser } from "@/lib/auth";

const formSchema = z.object({
  username: z.string().regex(
    /^[a-z0-9_]+$/,
    "Must contain only lowercase letters, numbers, or underscores",
  ).min(2).max(30),
  password: z.string().min(8).max(30),
  name: z.string().regex(
    /^[a-zA-Z \-]+$/,
    "Must contain only letters, hyphens, and spaces",
  ).min(2).max(30),
  email: z.string().email(),
  registrationSecret: z.string().min(5).max(8),
});

export default function RegisterFormCard() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    registerNewUser(values).catch((error) => {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred.");
      }
    }).then(() => {
      router.push("/login");
    }).finally(() => {
      setLoading(false);
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Robert Tables"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is how your name will appear in scores and rankings.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="drop.tables@gmail.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Secret</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="something-very-secret"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Get this from Ethan
                  </FormDescription>
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
                  Register
                </Button>
              )}
            {error && (
              <Alert
                variant="destructive"
                className="m-4 w-auto flex flex-row justify-start items-center"
              >
                <AlertTriangle className="h-8 w-8 mr-4 inline" />
                <div className="ml-4">
                  <AlertTitle>Registration Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </div>
              </Alert>
            )}
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login">
            <Button variant="link">
              Login
            </Button>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
