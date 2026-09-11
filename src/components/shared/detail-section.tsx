import type { ReactNode } from "react";

/**
 * A titled block inside a detail sheet or panel. A component rather than
 * repeated markup so the heading level and spacing stay consistent as sheets
 * are added, and so `min-w-0` is never forgotten - without it a long id or
 * URL inside pushes the whole sheet wider than the viewport.
 */
export function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground max-w-3xl text-sm">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
