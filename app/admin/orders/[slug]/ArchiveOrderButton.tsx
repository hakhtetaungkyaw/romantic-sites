"use client";

import { useState, useTransition } from "react";

import { ArchivedBadge } from "../StatusBadge";
import { setOrderArchived } from "./actions";

// Owns its own post-mutation state locally (seeded from the server's
// initialArchived prop, then updated directly from the action's own return
// value) rather than relying on the surrounding Server Component re-render
// to reach this subtree — that reseed does happen too (the action calls
// revalidatePath, which re-renders this route in the same response per
// node_modules/next/dist/docs/01-app/02-guides/server-actions.md), but a
// Client Component's own useState never resyncs to a changed prop on its
// own, so setting it explicitly here is what actually keeps the button
// label / badge correct immediately, regardless of that timing.
export default function ArchiveOrderButton({
  slug,
  initialArchived,
}: {
  slug: string;
  initialArchived: boolean;
}) {
  const [archived, setArchived] = useState(initialArchived);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      archived
        ? "Restore this order? It will reappear in the default orders list and its live site link will show the normal experience again."
        : 'Archive this order? It will be hidden from the default orders list and its live site link will show a "no longer available" message instead of the experience.',
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await setOrderArchived(slug, !archived);
      if (result.ok) {
        setArchived(result.isArchived);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {archived && <ArchivedBadge />}
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
            archived
              ? "border-green-500/40 text-green-300 hover:bg-green-500/10"
              : "border-red-500/40 text-red-300 hover:bg-red-500/10"
          }`}
        >
          {isPending ? (archived ? "Restoring…" : "Archiving…") : archived ? "Restore order" : "Archive order"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
