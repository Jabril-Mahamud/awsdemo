import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = import.meta.env.VITE_API_URL || "";

export function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        const regRes = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!regRes.ok) {
          const err = await regRes.json();
          throw new Error(err.detail || "Registration failed");
        }
      }
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!loginRes.ok) {
        const err = await loginRes.json();
        throw new Error(err.detail || "Login failed");
      }
      const data = await loginRes.json();
      onLogin(data.token);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{isRegister ? "Create account" : "Sign in"}</CardTitle>
          <CardDescription>
            {isRegister
              ? "Register to post a request and cast your votes."
              : "Sign in to the Kreator feature board."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">{isRegister ? "Register" : "Sign in"}</Button>
            <Button type="button" variant="ghost" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
