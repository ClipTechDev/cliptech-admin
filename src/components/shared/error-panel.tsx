import type { ReactNode } from "react";

/**
 * The box a failure is shown in, wherever it was caught: a query that came
 * back 403, a Server Component that threw, a URL that names nothing.
 *
 * Shared so the shape and the wording don't drift between the three places
 * that render one - an admin shouldn't have to work out whether they are
 * looking at an API failure or an app failure to know what to do next.
 */
export function ErrorPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  /** Whatever can be done about it - a retry, a way back, a sign-in. */
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      {children && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div>
      )}
    </div>
  );
}
