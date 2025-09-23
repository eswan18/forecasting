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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, LoaderCircle, Eye, EyeOff, Lock, User, UserPlus, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { z } from "zod";
import { registerNewUserIfAuthorized } from "@/lib/auth";

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
  name: z
    .string()
    .regex(/^[a-zA-Z \-]+$/, "Must contain only letters, hyphens, and spaces")
    .min(2)
    .max(30),
  email: z.string().email(),
});

export default function RegisterFormCard({
  inviteToken,
}: {
  inviteToken?: string;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    registerNewUserIfAuthorized({ ...values, inviteToken })
      .then(() => {
        router.push("/login");
      })
      .catch((error) => {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An error occurred.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your information to get started
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
                  <FormLabel className="text-sm font-medium">Username</FormLabel>
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
                  <FormLabel className="text-sm font-medium">Password</FormLabel>
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Display name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Enter your full name" 
                        className="pl-10 h-11"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
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
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 h-11"
                        {...field}
                      />
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
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Registration failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
        
        <div className="space-y-4">
          <Separator />
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?
              <Link href="/login" className="ml-1">
                <Button variant="link" className="h-auto p-0 text-sm font-normal text-primary hover:underline">
                  Sign in here
                </Button>
              </Link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
