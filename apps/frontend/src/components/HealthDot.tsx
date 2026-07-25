import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "";

export function HealthDot() {
  const [healthy, setHealthy] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const res = await fetch(`${API_URL}/healthz`);
        if (active) setHealthy(res.ok);
      } catch {
        if (active) setHealthy(false);
      }
    }

    check();
    const interval = setInterval(check, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <span
      title={healthy ? "Backend connected" : "Backend unreachable"}
      className={cn(
        "inline-block size-2.5 rounded-full",
        healthy ? "bg-green-500" : "bg-red-500",
      )}
    />
  );
}
