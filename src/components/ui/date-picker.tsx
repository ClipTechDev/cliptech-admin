"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * The wire format the API's `?from` / `?to` params and every form field in
 * this app use for a bare date. react-day-picker works in `Date`, so both
 * pickers below convert on the edges and never let a `Date` leak outward.
 */
const WIRE = "yyyy-MM-dd";
/** How a chosen date reads in the trigger. */
const LABEL = "MMM d, yyyy";

/** `"2026-01-05"` -> local-midnight `Date`; empty or unparseable -> undefined. */
function fromWire(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, WIRE, new Date());
  return isValid(parsed) ? parsed : undefined;
}

const toWire = (date?: Date) => (date ? format(date, WIRE) : "");

type Align = "start" | "center" | "end";

/**
 * Single bare date, e.g. a form's "starts on". Drop-in for an
 * `<Input type="date">`: `value` / `onChange` still speak `"yyyy-MM-dd"`, and
 * `onChange("")` is how it clears.
 */
export function DatePicker({
  value,
  onChange,
  id,
  className,
  placeholder = "Pick a date",
  disabled,
  align = "start",
  fromYear,
  toYear,
}: {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  align?: Align;
  fromYear?: number;
  toYear?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = fromWire(value);

  return (
    <div className={cn("relative w-full sm:w-auto", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              data-empty={!selected}
              className="w-full justify-start pr-8 font-normal data-[empty=true]:text-muted-foreground"
            />
          }
        >
          <CalendarIcon className="text-muted-foreground" />
          <span className="truncate">
            {selected ? format(selected, LABEL) : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="single"
            captionLayout={fromYear || toYear ? "dropdown" : "label"}
            startMonth={fromYear ? new Date(fromYear, 0) : undefined}
            endMonth={toYear ? new Date(toYear, 11) : undefined}
            defaultMonth={selected}
            selected={selected}
            onSelect={(date) => {
              onChange(toWire(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {selected && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear date"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

/**
 * A `from`–`to` pair behind one trigger and a two-month calendar. Replaces the
 * two side-by-side `<Input type="date">`s the filter bars used to carry;
 * `onChange` reports both ends every time, `""` for an end that isn't set yet.
 */
export function DateRangePicker({
  from,
  to,
  onChange,
  id,
  className,
  placeholder = "Pick a date range",
  disabled,
  align = "start",
  numberOfMonths = 2,
}: {
  from?: string;
  to?: string;
  onChange: (range: { from: string; to: string }) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  align?: Align;
  numberOfMonths?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const fromDate = fromWire(from);
  const toDate = fromWire(to);
  const hasValue = Boolean(fromDate || toDate);

  const selected: DateRange | undefined = fromDate
    ? { from: fromDate, to: toDate }
    : undefined;

  let label: React.ReactNode = placeholder;
  if (fromDate && toDate) {
    // Drop the repeated year when both ends share it: "Sep 2 – Oct 6, 2026".
    const sameYear = fromDate.getFullYear() === toDate.getFullYear();
    label = `${format(fromDate, sameYear ? "MMM d" : LABEL)} – ${format(toDate, LABEL)}`;
  } else if (fromDate) {
    label = `${format(fromDate, LABEL)} – …`;
  } else if (toDate) {
    label = `… – ${format(toDate, LABEL)}`;
  }

  return (
    <div className={cn("relative w-full sm:w-auto", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              data-empty={!hasValue}
              className="w-full justify-start pr-8 font-normal data-[empty=true]:text-muted-foreground"
            />
          }
        >
          <CalendarIcon className="text-muted-foreground" />
          <span className="truncate">{label}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            mode="range"
            numberOfMonths={numberOfMonths}
            defaultMonth={fromDate}
            selected={selected}
            onSelect={(range) =>
              onChange({ from: toWire(range?.from), to: toWire(range?.to) })
            }
          />
        </PopoverContent>
      </Popover>

      {hasValue && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear date range"
          onClick={() => onChange({ from: "", to: "" })}
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}
