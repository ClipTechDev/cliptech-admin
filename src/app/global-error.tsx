"use client";

/**
 * The last resort: a throw in the root layout itself, which replaces the whole
 * document rather than a segment of it.
 *
 * Nothing from the app is used here on purpose - not the design system, not
 * globals.css, not the theme provider. This renders when the shell that would
 * have supplied all three is the thing that failed, and Next serves it as its
 * own document without the app's global styles, so the styling is inline and
 * the colours are the CSS system pair, which follows the OS scheme on its own.
 *
 * A Client Component can't export metadata, so the title is the React element.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" style={{ colorScheme: "light dark" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "Canvas",
          color: "CanvasText",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          fontSize: "0.875rem",
          lineHeight: 1.5,
        }}
      >
        <title>ClipTech Admin</title>
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            border: "1px dashed GrayText",
            borderRadius: "0.5rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontWeight: 500 }}>ClipTech Admin couldn&apos;t start</p>
          <p style={{ margin: "0.25rem 0 0", color: "GrayText" }}>
            {error.message || "Something went wrong before the page could render."}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1rem",
              padding: "0.375rem 0.75rem",
              font: "inherit",
              fontWeight: 500,
              color: "inherit",
              background: "transparent",
              border: "1px solid GrayText",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ margin: "0.5rem 0 0", color: "GrayText", fontSize: "0.75rem" }}>
              Reference <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
