"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Wordmark } from "@/components/navbar/wordmark";

interface LoginFormCardProps {
  redirectUrl?: string;
  initialError?: string;
}

export default function LoginFormCard({
  redirectUrl = "/",
  initialError,
}: LoginFormCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleSignIn() {
    setLoading(true);
    const oauthUrl = `/oauth/login?returnUrl=${encodeURIComponent(redirectUrl)}`;
    router.push(oauthUrl);
  }

  return (
    <Card className="w-full">
      <CardHeader className="gap-3">
        <Wordmark />
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Sign in
          </CardTitle>
          <CardDescription>
            You&apos;ll be redirected to your identity provider to continue.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSignIn}
          className="h-11 w-full font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Redirecting...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        {initialError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication failed</AlertTitle>
            <AlertDescription>{initialError}</AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account? Contact Ethan to get set up.
        </p>
      </CardContent>
    </Card>
  );
}
