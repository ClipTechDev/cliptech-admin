"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-picker";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

/** A dropdown filter, e.g. status. `value` of "" means "no filter". */
export type ToolbarFilter = {
  id: string;
  label: string;
  value: string;
  options: readonly { label: string; value: string }[];
  onChange: (value: string) => void;
  /**
   * Wording for the unfiltered option. Defaults to "All <label>", which reads
   * fine for a label that is already plural and wrong for one that isn't
   * ("All role"), so anything with an irregular plural passes its own.
   */
  allLabel?: string;
};

/** Server-side free-text search, debounced before it reaches `onChange`. */
export type ToolbarSearch = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  /** Server-driven search. Mutually exclusive with `searchColumnId`. */
  search?: ToolbarSearch;
  /** In-memory search against one column, for client-mode tables. */
  searchColumnId?: string;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  /** Created-at range, matching the API's ?from/?to pair. */
  dateRange?: {
    from: string;
    to: string;
    onChange: (range: { from?: string; to?: string }) => void;
  };
  /** Shown when anything is filtered; clears every control at once. */
  onReset?: () => void;
  isFiltered?: boolean;
  children?: React.ReactNode;
}

/**
 * Filter bar for both DataTable modes.
 *
 * The search box holds its own draft state and debounces upward, because in
 * server mode every keystroke would otherwise rewrite the URL and fire a
 * request. It re-syncs when `search.value` changes from the outside (a reset,
 * or the back button) so the input never disagrees with the URL.
 */
export function DataTableToolbar<TData>({
  table,
  search,
  searchColumnId,
  searchPlaceholder = "Search...",
  filters,
  dateRange,
  onReset,
  isFiltered,
  children,
}: DataTableToolbarProps<TData>) {
  const searchColumn = searchColumnId ? table.getColumn(searchColumnId) : undefined;

  const externalValue = search?.value ?? "";
  const [draft, setDraft] = React.useState(externalValue);
  const [lastExternal, setLastExternal] = React.useState(externalValue);
  const debounced = useDebouncedValue(draft, 350);

  // Adopt a value that changed outside this component - a Reset, or the back
  // button restoring an earlier URL. Adjusting state during render is the
  // supported way to do this; an effect would render the stale draft first.
  if (externalValue !== lastExternal) {
    setLastExternal(externalValue);
    setDraft(externalValue);
  }

  const onSearchChange = search?.onChange;
  React.useEffect(() => {
    if (!onSearchChange) return;
    // `debounced !== draft` means the timer is still trailing an edit that has
    // since been overwritten - pushing it would resurrect a cleared search.
    if (debounced !== draft) return;
    if (debounced === externalValue) return;
    onSearchChange(debounced);
  }, [debounced, draft, externalValue, onSearchChange]);

  const showReset =
    isFiltered ?? (searchColumn ? table.getState().columnFilters.length > 0 : false);

  return (
    // Stacks on phones and only becomes a single row once there is width for
    // one; every control below is fluid so nothing forces a horizontal scroll.
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 sm:flex-1">
        {search && (
          <Input
            placeholder={search.placeholder ?? searchPlaceholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-8 w-full sm:w-64"
            aria-label={search.placeholder ?? searchPlaceholder}
          />
        )}

        {!search && searchColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={(searchColumn.getFilterValue() as string) ?? ""}
            onChange={(event) => searchColumn.setFilterValue(event.target.value)}
            className="h-8 w-full sm:w-64"
            aria-label={searchPlaceholder}
          />
        )}

        {filters?.map((filter) => (
          <Select
            key={filter.id}
            // Base UI's Select has no notion of an empty value, so "all" is a
            // real option that maps back to "" - the API's "no filter".
            value={filter.value || "all"}
            onValueChange={(value) => filter.onChange(value === "all" ? "" : String(value))}
          >
            <SelectTrigger
              // Full width on a phone so it gets its own row; fixed alongside
              // the others once there is room.
              className="h-8 w-full sm:w-auto sm:min-w-[8rem]"
              aria-label={filter.label}
            >
              {/* Base UI renders the raw value unless given a render function,
                  which would show "all" and "auth_failed" rather than labels. */}
              <SelectValue>
                {(value) =>
                  value === "all"
                    ? (filter.allLabel ?? `All ${filter.label.toLowerCase()}`)
                    : (filter.options.find((option) => option.value === value)?.label ??
                      filter.label)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {filter.allLabel ?? `All ${filter.label.toLowerCase()}`}
              </SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {dateRange && (
          <DateRangePicker
            id="filter-date-range"
            from={dateRange.from}
            to={dateRange.to}
            onChange={dateRange.onChange}
            placeholder="Any date"
          />
        )}

        {children}

        {showReset && (
          <Button
            variant="ghost"
            onClick={() => (onReset ? onReset() : table.resetColumnFilters())}
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <div className="self-end sm:self-auto">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
