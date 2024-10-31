"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { mutate } = useCurrentUser();

  const loginUser = async (username: string, password: string) => {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const data = await res.json();
      // throw an error with the message from the server
      throw new Error(data.error || "An unkown error occurred.");
    }

    // Revalidate the user after login.
    mutate();
    router.push("/");
  };

  return (
    <div className="flex items-center justify-center mt-48">
      <LoginFormCard loginUser={loginUser} />
    </div>
  );
}

interface LoginFormCardProps {
  loginUser: (username: string, password: string) => Promise<void>;
}

function LoginFormCard({ loginUser }: LoginFormCardProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginUser(username, password).then(() => {
      setUsername("");
      setPassword("");
    }).catch((error) => {
      setError(error.message);
    });
  };
  return (
    <Card className="w-full max-w-md mx-4">
      <CardHeader>
        <CardTitle className="text-xl">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
          {error && (
            <Alert variant="destructive" className="m-4 w-auto flex flex-row justify-start items-center">
              <AlertTriangle className="h-8 w-8 mr-4 inline" />
              <div className="ml-4">
                <AlertTitle>Login Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register">
            <Button variant="link">
              Register
            </Button>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
