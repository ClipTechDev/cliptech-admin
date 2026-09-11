import { Skeleton } from "@/components/ui/skeleton";

/**
 * The overview's shape while it loads.
 *
 * QueryState's default three lines are right for a small panel and wrong
 * here: this page is five rows of cards, and collapsing it to three lines
 * makes the whole layout jump when the data lands. Mirroring the real
 * structure means nothing moves.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[6.5rem] rounded-lg" />
        ))}
      </div>

      {Array.from({ length: 4 }).map((_, section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, card) => (
              <Skeleton key={card} className="h-[5.5rem] rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
