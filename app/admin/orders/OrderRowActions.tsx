"use client";

import { Archive, ArchiveRestore, ExternalLink } from "lucide-react";
import { useTransition } from "react";

import { setOrderArchived } from "./[slug]/actions";

const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50";

// Compact, icon-only counterpart to [slug]/ArchiveOrderButton.tsx for a
// table cell — that component's own full-width pill + label + badge +
// below-button error line is sized for a page header, not a table row, so
// this is a lighter variant rather than reusing it directly. Calls the
// exact same setOrderArchived server action (no duplicate archive logic),
// just with table-appropriate chrome: an icon, a native `title` tooltip,
// and a plain window.alert on failure instead of a persistent error line
// (a table row has no room to reserve for one, and failures here are rare
// network/db blips, not routine).
//
// Fully controlled (`archived` + `onArchivedChange`), not locally-stated
// like ArchiveOrderButton's own initialArchived/useState pair — verified
// live (see this task's own verification pass) that relying on the
// action's revalidatePath("/admin/orders") call to refresh
// OrdersExplorer's `orders` prop does NOT happen in place: the row stayed
// undimmed, badge-less, and still filtered into the default view after
// archiving, even though this button's own local state (when it had its
// own) flipped correctly. OrdersExplorer.tsx owns the single source of
// truth for every row's isArchived (see its own orderRows state) so that
// the row's dimming, ArchivedBadge, and filter-inclusion all update
// atomically with this button's icon, instead of three separate pieces of
// state (this button's, the badge's, the filter's) racing each other.
export default function OrderRowActions({
  slug,
  archived,
  onArchivedChange,
}: {
  slug: string;
  archived: boolean;
  onArchivedChange: (archived: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleArchiveClick() {
    const confirmed = window.confirm(
      archived
        ? "Restore this order? It will reappear in the default orders list and its live site link will show the normal experience again."
        : 'Archive this order? It will be hidden from the default orders list and its live site link will show a "no longer available" message instead of the experience.',
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await setOrderArchived(slug, !archived);
      if (result.ok) {
        onArchivedChange(result.isArchived);
      } else {
        window.alert(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`/site/${encodeURIComponent(slug)}`}
        target="_blank"
        rel="noreferrer"
        title="Open live site"
        aria-label="Open live site"
        className={iconButtonClass}
      >
        <ExternalLink size={15} />
      </a>
      <button
        type="button"
        onClick={handleArchiveClick}
        disabled={isPending}
        title={archived ? "Restore order" : "Archive order"}
        aria-label={archived ? "Restore order" : "Archive order"}
        className={iconButtonClass}
      >
        {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
      </button>
    </div>
  );
}
