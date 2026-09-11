import { PageHeader } from "@/components/shared/page-header";
import { ExportsTable } from "@/components/exports/exports-table";

/**
 * The CSV downloads.
 *
 * Not SSR-prefetched: nothing here is fetched until a link is clicked, and
 * the filters live in component state rather than the URL because they are a
 * scratch pad for building one download, not a view worth sharing.
 */
export default function ExportsPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Exports"
        description="Reports as CSV. Set the filters once, then take whichever file you need."
      />
      <ExportsTable />
    </div>
  );
}
