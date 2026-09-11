"use client";

import * as React from "react";

import { formatDateTime, formatNumber } from "@/lib/format";
import type { ViewLog } from "@/schemas/submission";

/**
 * Views over time for one post - the shape of its tracker history.
 *
 * Two series, because the gap between them is the question an admin is here
 * to answer: raw views are what the platform reports, payable views are what
 * the campaign will actually pay for. A post whose raw line climbs while its
 * payable line flattens has hit the campaign's per-post cap or is accruing
 * views that don't qualify, and no table of numbers shows that as fast.
 *
 * Earnings are deliberately NOT a third line. They are money, not views, and
 * putting a second y-scale on the same plot is the one thing a chart must
 * never do; the figure lives in the table below and in the tooltip.
 */

const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

type Point = { x: number; y: number; log: ViewLog };

export function ViewLogChart({ logs }: { logs: ViewLog[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(720);
  const [active, setActive] = React.useState<number | null>(null);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Oldest first: a time axis has to run forwards, and the API returns the
  // history newest-first.
  const ordered = React.useMemo(
    () => [...logs].sort((a, b) => +new Date(a.tracked_at) - +new Date(b.tracked_at)),
    [logs]
  );

  // A failed poll still writes a row - that is the point of the table - but
  // its zeroes are "we couldn't read the post", not "the post has no views".
  // Plotting them would draw a crash that never happened, so they are marked
  // on the axis instead and left out of the lines.
  const readings = ordered.filter((log) => !log.fetch_error);
  const failures = ordered.filter((log) => log.fetch_error);

  const plotWidth = Math.max(width - PAD.left - PAD.right, 10);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const scales = React.useMemo(() => {
    if (readings.length === 0) return null;

    const times = ordered.map((log) => +new Date(log.tracked_at));
    const minX = Math.min(...times);
    const maxX = Math.max(...times);
    const maxY = Math.max(...readings.map((log) => log.raw_views), 1);

    const x = (time: number) =>
      PAD.left + (maxX === minX ? plotWidth / 2 : ((time - minX) / (maxX - minX)) * plotWidth);
    const y = (value: number) => PAD.top + plotHeight - (value / maxY) * plotHeight;

    return { x, y, maxY, minX, maxX };
  }, [ordered, readings, plotWidth, plotHeight]);

  if (readings.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        {ordered.length === 0
          ? "No tracking readings yet."
          : "Every reading so far failed to fetch - see the errors below."}
      </p>
    );
  }

  const { x, y, maxY } = scales!;

  const series = [
    {
      key: "raw" as const,
      name: "Raw views",
      color: "var(--chart-1)",
      points: readings.map<Point>((log) => ({
        x: x(+new Date(log.tracked_at)),
        y: y(log.raw_views),
        log,
      })),
      value: (log: ViewLog) => log.raw_views,
    },
    {
      key: "payable" as const,
      name: "Payable views",
      color: "var(--chart-2)",
      points: readings.map<Point>((log) => ({
        x: x(+new Date(log.tracked_at)),
        y: y(log.payable_views),
        log,
      })),
      value: (log: ViewLog) => log.payable_views,
    },
  ];

  const ticks = niceTicks(maxY, 4);

  function pointerIndex(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    // Nearest reading by x, so the pointer only has to be closest rather than
    // land on a 2px line.
    let nearest = 0;
    let best = Infinity;
    series[0].points.forEach((point, index) => {
      const distance = Math.abs(point.x - offsetX);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    return nearest;
  }

  const activeLog = active !== null ? readings[active] : null;
  const activeX = active !== null ? series[0].points[active].x : 0;

  return (
    <div ref={containerRef} className="w-full">
      {/* Identity never rests on colour alone: the legend names both series,
          and the tooltip repeats the names on every reading. */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {series.map((line) => (
          <span key={line.key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <svg width="14" height="2" aria-hidden="true">
              <line
                x1="0"
                y1="1"
                x2="14"
                y2="1"
                stroke={line.color}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {line.name}
          </span>
        ))}
        {failures.length > 0 && (
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <svg width="10" height="10" aria-hidden="true">
              <path
                d="M2 2 L8 8 M8 2 L2 8"
                stroke="var(--destructive)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {failures.length} failed {failures.length === 1 ? "poll" : "polls"}
          </span>
        )}
      </div>

      <div className="relative">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Raw and payable views across ${readings.length} tracking readings`}
          tabIndex={0}
          className="focus-visible:ring-ring/50 touch-none rounded outline-none focus-visible:ring-2"
          onPointerMove={(event) => setActive(pointerIndex(event))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((current) => current ?? readings.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(event) => {
            // Keyboard reaches the same readings the pointer does.
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              setActive((current) => {
                const next = (current ?? 0) + (event.key === "ArrowRight" ? 1 : -1);
                return Math.max(0, Math.min(readings.length - 1, next));
              });
            }
          }}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                y1={y(tick)}
                x2={width - PAD.right}
                y2={y(tick)}
                stroke="currentColor"
                strokeWidth="1"
                className="text-border"
              />
              <text
                x={PAD.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {compact(tick)}
              </text>
            </g>
          ))}

          {/* First and last reading only - a label under every point is noise. */}
          <text
            x={PAD.left}
            y={HEIGHT - 8}
            className="fill-muted-foreground text-[10px]"
          >
            {shortDate(readings[0].tracked_at)}
          </text>
          {readings.length > 1 && (
            <text
              x={width - PAD.right}
              y={HEIGHT - 8}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {shortDate(readings[readings.length - 1].tracked_at)}
            </text>
          )}

          {failures.map((log) => (
            <path
              key={log.id}
              d={crossPath(x(+new Date(log.tracked_at)), PAD.top + plotHeight + 6, 3)}
              stroke="var(--destructive)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            >
              <title>{`Fetch failed ${formatDateTime(log.tracked_at)}: ${log.fetch_error}`}</title>
            </path>
          ))}

          {series.map((line) =>
            line.points.length === 1 ? (
              <circle key={line.key} cx={line.points[0].x} cy={line.points[0].y} r="4" fill={line.color} />
            ) : (
              <path
                key={line.key}
                d={linePath(line.points)}
                fill="none"
                stroke={line.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )
          )}

          {active !== null && (
            <g pointerEvents="none">
              <line
                x1={activeX}
                y1={PAD.top}
                x2={activeX}
                y2={PAD.top + plotHeight}
                stroke="currentColor"
                strokeWidth="1"
                className="text-muted-foreground/50"
              />
              {series.map((line) => (
                <circle
                  key={line.key}
                  cx={line.points[active].x}
                  cy={line.points[active].y}
                  r="4"
                  fill={line.color}
                  /* A 2px surface ring keeps the marker legible where the two
                     series cross. */
                  stroke="var(--card)"
                  strokeWidth="2"
                />
              ))}
            </g>
          )}
        </svg>

        {activeLog && (
          <div
            className="bg-popover text-popover-foreground pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border p-2 shadow-md"
            style={{
              // Flip to the left of the crosshair near the right edge so the
              // readout never leaves the plot.
              left: Math.min(Math.max(activeX + 12, 0), Math.max(width - 176, 0)),
            }}
          >
            <p className="text-muted-foreground mb-1 text-xs">
              {formatDateTime(activeLog.tracked_at)}
            </p>
            {series.map((line) => (
              <p key={line.key} className="flex items-baseline gap-2 text-sm">
                <svg width="10" height="2" className="shrink-0" aria-hidden="true">
                  <line x1="0" y1="1" x2="10" y2="1" stroke={line.color} strokeWidth="2" />
                </svg>
                {/* Value leads, name follows: the reader already has the
                    series and wants the number. */}
                <span className="font-medium tabular-nums">
                  {formatNumber(line.value(activeLog))}
                </span>
                <span className="text-muted-foreground text-xs">{line.name}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function linePath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

function crossPath(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy - r} L${cx + r},${cy + r} M${cx + r},${cy - r} L${cx - r},${cy + r}`;
}

/** Round tick values, so the axis reads 0 / 5k / 10k rather than 0 / 4.7k. */
function niceTicks(max: number, count: number): number[] {
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) ticks.push(Math.round(value));
  return ticks;
}

function compact(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
