"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, LogIn } from "lucide-react";
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
    <Card className="w-full shadow-xl border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in with your identity provider account
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-base text-center text-muted-foreground">
              We've migrated to a new login system!
            </p>
            <p className="text-sm text-center">
              You'll be directed there to sign in.
              If this is your first time signing in, <span className="font-bold">you&apos;ll need to reset your password</span> there.
            </p>
            <p className="text-sm text-center text-muted-foreground">
              But don't worry, the reset password process actually works now.
            </p>
          </div>

          <Button
            onClick={handleSignIn}
            className="w-full h-11 text-base font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Redirecting...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </>
            )}
          </Button>

          {initialError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication failed</AlertTitle>
              <AlertDescription>{initialError}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-3 text-center">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account? You&apos;ll need an invite link from
              Ethan to register.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
