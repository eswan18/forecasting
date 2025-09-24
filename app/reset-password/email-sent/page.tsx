import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default async function EmailSentPage() {
  return (
    <div className="flex flex-col items-center justify-start pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Card className="w-full shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300">
                Email Sent!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Check your inbox for password reset instructions
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                If this username exists and is associated with your email
                address, you&apos;ll receive a password reset email.
              </p>

              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Usually takes about 5 minutes
                </div>
                <p className="text-xs text-muted-foreground">
                  We use a low-budget email service, so please be patient!
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Separator />

              <div className="text-center">
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full h-11 text-base font-medium"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
