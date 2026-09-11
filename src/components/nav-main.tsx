"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

/**
 * One group of links. `label` is optional because the first group is the
 * app's main sections and naming those would be noise; the groups below it
 * are narrower and benefit from a heading.
 */
export function NavMain({ items, label }: { items: NavItem[]; label?: string }) {
  const pathname = usePathname();

  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="text-[0.6875rem] font-medium tracking-wider uppercase">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarMenu>
        {items.map((item) => {
          const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);

          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={item.title}
                render={<Link href={item.url} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
