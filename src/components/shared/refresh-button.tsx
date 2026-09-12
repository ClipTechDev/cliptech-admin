"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";

const TICK_MS = 30 * 1000;

let tick = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribeToClock(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => {
    tick += 1;
    for (const notify of listeners) notify();
  }, TICK_MS);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const getTick = () => tick;
const getServerTick = () => null;

function useAgeLabel(updatedAt: number | undefined) {
  const mounted =
    React.useSyncExternalStore(subscribeToClock, getTick, getServerTick) !== null;

  return mounted ? formatAgo(updatedAt) : null;
}

export function RefreshButton({
  onRefresh,
  isRefreshing = false,
  updatedAt,
  label = "Refresh",
  showAge = true,
  size = "default",
  className,
}: {
  onRefresh: () => void;
  isRefreshing?: boolean;
  updatedAt?: number;
  label?: string;
  showAge?: boolean;
  size?: "sm" | "default";
  className?: string;
}) {
  const age = useAgeLabel(updatedAt);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAge && age && (
        <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">Updated {age}</span>
      )}
      <Button
        variant="outline"
        size={size}
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label={label}
        aria-busy={isRefreshing || undefined}
      >
        <RefreshCw className={cn(isRefreshing && "animate-spin")} aria-hidden />
        {label}
      </Button>
    </div>
  );
}
