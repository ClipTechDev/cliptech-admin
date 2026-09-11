"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function titleCase(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Record ids make poor breadcrumb text - `usr_01H8X...` is long, unreadable,
 * and on a phone it is the whole header. Anything that looks like an id is
 * shortened; a real slug (`new`) is left alone.
 */
function label(segment: string) {
  const looksLikeId = segment.length > 12 || /\d/.test(segment);
  return looksLikeId ? `${segment.slice(0, 8)}…` : titleCase(segment);
}

export function SiteHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
      {/* min-w-0 so a deep path truncates inside the header rather than
          widening it; the trail itself hides all but the last crumb on a
          phone, where the sidebar is the real navigation anyway. */}
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="hidden sm:flex">
            <BreadcrumbLink render={<Link href="/" />}>Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join("/")}`;
            const isLast = index === segments.length - 1;

            return (
              <Fragment key={href}>
                <BreadcrumbSeparator className={isLast ? "hidden sm:block" : "hidden sm:block"} />
                <BreadcrumbItem className={isLast ? "min-w-0" : "hidden sm:flex"}>
                  {isLast ? (
                    <BreadcrumbPage className="truncate">{label(segment)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={href} />}>
                      {label(segment)}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
