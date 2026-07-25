import { Github, Linkedin, ArrowRight } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HealthDot } from "./HealthDot";

const GITHUB_URL = "https://github.com/Jabril-Mahamud/Kreator";
const LINKEDIN_URL = "https://www.linkedin.com/in/jabril-mahamud/";

const features = [
  "Crossplane infrastructure",
  "ArgoCD GitOps",
  "Sealed Secrets",
  "LGTM observability",
  "nginx ingress",
  "Kind local / AWS cloud",
];

export function Landing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <div className="mb-6 flex items-center gap-2">
        <HealthDot />
        <span className="text-xs tracking-wide text-muted-foreground">
          live example, scaffolded and deployed by Kreator
        </span>
      </div>

      <h1 className="mb-4 text-6xl font-bold tracking-tight">Kreator</h1>
      <p className="mb-3 text-xl text-foreground/90">
        Scaffold deployment-ready full-stack apps with Kubernetes, Crossplane, and ArgoCD baked in.
      </p>
      <p className="mb-8 text-base leading-relaxed text-muted-foreground">
        Like <code className="rounded bg-muted px-1.5 py-0.5 text-sm">create-next-app</code>, but the
        output ships with infrastructure-as-code, GitOps, Helm charts, and observability, wired
        together and ready to deploy. This page was generated and deployed by the CLI, and the board
        behind it is a working feature-request app.
      </p>

      <div className="mb-10 flex flex-wrap gap-2">
        {features.map((f) => (
          <Badge key={f} variant="outline" className="text-muted-foreground">
            {f}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={onLaunch}>
          Open the feature board
          <ArrowRight />
        </Button>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <Github />
          GitHub
        </a>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <Linkedin />
          LinkedIn
        </a>
      </div>
    </main>
  );
}
