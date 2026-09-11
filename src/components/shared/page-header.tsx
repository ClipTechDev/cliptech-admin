import type { ReactNode } from "react";

/**
 * Title block every admin page opens with. A component rather than repeated
 * markup so heading level, spacing and the actions slot stay consistent as
 * pages are added.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      {/* min-w-0 lets the long values these carry - emails, ids - wrap rather
          than push the actions off the edge of a phone screen. */}
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight break-words sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm break-words">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
