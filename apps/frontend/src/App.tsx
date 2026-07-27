import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Landing } from "./components/Landing";
import { LoginForm } from "./components/LoginForm";
import { FeatureBoard } from "./components/FeatureBoard";
import { HealthDot } from "./components/HealthDot";

export function App() {
  const [launched, setLaunched] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  if (!launched) {
    return <Landing onLaunch={() => setLaunched(true)} />;
  }

  if (!token) {
    return <LoginForm onLogin={setToken} />;
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kreator feature board</h1>
          <p className="text-sm text-muted-foreground">Post one request, spend 3 up / 2 down votes.</p>
        </div>
        <div className="flex items-center gap-3">
          <HealthDot />
          <Button variant="outline" size="sm" onClick={() => setToken(null)}>
            Sign out
          </Button>
        </div>
      </header>
      <FeatureBoard token={token} onUnauth={() => setToken(null)} />
    </main>
  );
}
