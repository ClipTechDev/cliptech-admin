"use client";

import * as React from "react";
import { Image as ImageIcon, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * A reusable "pick an image, then upload it" control.
 *
 * Everything to do with the image lives here: client-side validation, the
 * hidden file input, the object-URL preview and its cleanup, the replace and
 * remove buttons, the inline error, and the upload call itself. A caller wires
 * it to a resource by passing `upload` - the one part that is endpoint-specific
 * - and, where the parent record has to exist first (a create form), drives the
 * upload through the imperative `commit()` on the ref rather than letting it run
 * on pick.
 */

/** Mirrors storage.allowedImageContentTypes and storage.MaxImageSize on the API. */
export const IMAGE_UPLOAD_ACCEPT = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

/** Returns an error message for a file the API would reject, or null if it's fine. */
export function validateImageFile(file: File): string | null {
  if (!(IMAGE_UPLOAD_ACCEPT as readonly string[]).includes(file.type)) {
    return "Use a JPEG, PNG or WebP image.";
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return "Image must be under 5MB.";
  }
  return null;
}

export type ImageUploadFieldHandle = {
  /** Whether a file has been picked but not yet uploaded. */
  readonly hasPendingFile: boolean;
  /**
   * Uploads the staged file via `upload`. Resolves with the stored URL, or
   * null when nothing is staged. Clears the staged file on success; rejects
   * (leaving the file staged) if the upload fails.
   */
  commit: () => Promise<string | null>;
  /** Drops the staged file and any error, back to just showing `value`. */
  reset: () => void;
};

export type ImageUploadFieldProps = {
  /** The stored image URL, shown when no local file is staged. */
  value: string | null;
  /** Uploads a file and resolves with its stored URL. */
  upload: (file: File) => Promise<string>;
  /**
   * The effective image changed: a URL after a successful `commit()`, or null
   * after the user removes an existing image.
   */
  onChange?: (url: string | null) => void;
  /** Fires as a file is staged or cleared, so a form can track unsaved changes. */
  onPendingChange?: (hasPendingFile: boolean) => void;
  /** Fires around an in-flight upload, so a form can disable its submit. */
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Sizing for the preview box; defaults to a 16:9-ish thumbnail. */
  previewClassName?: string;
  ref?: React.Ref<ImageUploadFieldHandle>;
};

export function ImageUploadField({
  value,
  upload,
  onChange,
  onPendingChange,
  onBusyChange,
  disabled,
  className,
  previewClassName = "h-20 w-36",
  ref,
}: ImageUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // A staged file previews from an object URL; revoke it when it changes or the
  // component unmounts so the blob isn't leaked.
  const preview = React.useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function stage(next: File | null) {
    setFile(next);
    onPendingChange?.(next !== null);
  }

  React.useImperativeHandle(
    ref,
    () => ({
      get hasPendingFile() {
        return file !== null;
      },
      async commit() {
        if (!file) return null;
        setBusy(true);
        onBusyChange?.(true);
        try {
          const url = await upload(file);
          stage(null);
          setError(null);
          onChange?.(url);
          return url;
        } finally {
          setBusy(false);
          onBusyChange?.(false);
        }
      },
      reset() {
        stage(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
      },
    }),
    // `upload` and the callbacks are read fresh on each render via closure; the
    // handle only needs to change when `file` does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file]
  );

  function pick(next: File | undefined) {
    if (!next) return;
    const message = validateImageFile(next);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    stage(next);
  }

  function remove() {
    stage(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange?.(null);
  }

  const shownSrc = preview ?? (value || null);
  const isDisabled = disabled || busy;

  return (
    <div className={cn("flex items-start gap-4", className)}>
      {shownSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shownSrc}
          alt="Upload preview"
          className={cn("shrink-0 rounded-lg border object-cover", previewClassName)}
        />
      ) : (
        <div
          className={cn(
            "bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-lg border border-dashed",
            previewClassName
          )}
        >
          <ImageIcon className="size-5" />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDisabled}
            onClick={() => inputRef.current?.click()}
          >
            <Upload />
            {shownSrc ? "Replace" : "Upload image"}
          </Button>
          {shownSrc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDisabled}
              onClick={remove}
            >
              Remove
            </Button>
          )}
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_UPLOAD_ACCEPT.join(",")}
          className="hidden"
          onChange={(event) => {
            pick(event.target.files?.[0]);
            // Let the same file be re-picked after a validation error.
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
