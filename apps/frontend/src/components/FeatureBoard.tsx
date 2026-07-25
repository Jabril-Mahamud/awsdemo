import { useState, useEffect, useCallback } from "react";
import { ArrowBigUp, ArrowBigDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "";

interface Feature {
  id: string;
  title: string;
  description: string | null;
  author: string;
  score: number;
  upvotes: number;
  downvotes: number;
  mine: boolean;
  my_vote: number;
}

interface Board {
  features: Feature[];
  upvotes_remaining: number;
  downvotes_remaining: number;
  has_request: boolean;
}

export function FeatureBoard({ token, onUnauth }: { token: string; onUnauth: () => void }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const apply = useCallback(
    async (res: Response) => {
      if (res.status === 401) {
        onUnauth();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Something went wrong");
        return;
      }
      setError("");
      setBoard(data);
    },
    [onUnauth],
  );

  const load = useCallback(async () => {
    await apply(await fetch(`${API_URL}/api/features`, { headers }));
  }, [apply, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await apply(
      await fetch(`${API_URL}/api/features`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title, description: description || null }),
      }),
    );
    setTitle("");
    setDescription("");
  }

  async function deleteMine() {
    await apply(await fetch(`${API_URL}/api/features/mine`, { method: "DELETE", headers }));
  }

  async function vote(f: Feature, dir: 1 | -1) {
    // Clicking the direction you already picked clears the vote (frees budget).
    const value = f.my_vote === dir ? 0 : dir;
    await apply(
      await fetch(`${API_URL}/api/features/${f.id}/vote`, {
        method: "POST",
        headers,
        body: JSON.stringify({ value }),
      }),
    );
  }

  if (!board) {
    return <p className="p-10 text-center text-muted-foreground">Loading board...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!board.has_request && (
        <Card>
          <CardHeader>
            <CardTitle>Request a feature</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <Input
                placeholder="Short title"
                value={title}
                maxLength={140}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Describe it (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button type="submit" className="self-start">
                Submit request
              </Button>
              <p className="text-xs text-muted-foreground">One request per person.</p>
            </form>
          </CardContent>
        </Card>
      )}

      {board.features.length === 0 && (
        <p className="text-center text-muted-foreground">No requests yet. Be the first.</p>
      )}

      {board.features.map((f) => (
        <Card key={f.id}>
          <CardContent className="flex items-start gap-4 p-4">
            <div className="flex flex-col items-center gap-1">
              <Button
                variant={f.my_vote === 1 ? "default" : "outline"}
                size="icon"
                disabled={board.upvotes_remaining < 1 && f.my_vote !== 1}
                onClick={() => vote(f, 1)}
                title="Upvote"
              >
                <ArrowBigUp />
              </Button>
              <span className="text-sm font-semibold tabular-nums">{f.score}</span>
              <Button
                variant={f.my_vote === -1 ? "destructive" : "outline"}
                size="icon"
                disabled={board.downvotes_remaining < 1 && f.my_vote !== -1}
                onClick={() => vote(f, -1)}
                title="Downvote"
              >
                <ArrowBigDown />
              </Button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{f.title}</h3>
                {f.mine && <Badge variant="secondary">yours</Badge>}
              </div>
              {f.description && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {f.description}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                by {f.author} · {f.upvotes} up / {f.downvotes} down
              </p>
            </div>

            {f.mine && (
              <Button variant="ghost" size="icon" onClick={deleteMine} title="Delete your request">
                <Trash2 />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center gap-2 pt-2 text-xs text-muted-foreground">
        <span className={cn(board.upvotes_remaining === 0 && "text-destructive")}>
          {board.upvotes_remaining} upvotes left
        </span>
        <span>·</span>
        <span className={cn(board.downvotes_remaining === 0 && "text-destructive")}>
          {board.downvotes_remaining} downvotes left
        </span>
      </div>
    </div>
  );
}
