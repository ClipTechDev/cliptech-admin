"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  Download,
  FileVideo,
  LayoutDashboard,
  ListChecks,
  MessageSquareWarning,
  Megaphone,
  BellRing,
  Plug,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Activity,
  UserPlus,
  Users,
} from "lucide-react";

import { useAdminMeQuery } from "@/hooks/use-admin";
import { ADMINS_ROLE, hasRole, SUPER_ADMIN_ROLE, USERS_ROLE } from "@/schemas/admin";
import { NavMain, type NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

/**
 * `role` is the grant cliptech-api requires for that section's routes, and
 * `superAdmin` marks the sections mounted behind RequireSuperAdmin rather
 * than a role - which is a stricter check, not a role named "super_admin".
 *
 * A section the signed-in admin can't use is hidden rather than shown and
 * then 403'd - but this is presentation only: the API re-checks every request
 * against the stored row, so hiding a link grants nothing and protects
 * nothing.
 */
type Section = NavItem & { role?: string; superAdmin?: boolean };

type NavGroup = { label?: string; items: Section[] };

/**
 * The sidebar in five bands, ordered the way the work flows: an unlabelled
 * landing group, then the review queues, then who is on the platform, then
 * the tools an admin reaches for, then the super-admin-only plumbing.
 *
 * A whole band renders only if the signed-in admin can see at least one item
 * in it (the `visible` filter below drops the empties), so an admin with a single grant still gets a
 * tidy sidebar rather than a run of empty headings. Exports carries no role:
 * each report inside it sits behind the role that owns its data and the page
 * greys out the ones an admin cannot pull, so hiding the section would be
 * wrong for anyone holding exactly one of those grants.
 */
const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { title: "Campaigns", url: "/campaigns", icon: Megaphone, role: "campaigns" },
      { title: "Join requests", url: "/join-requests", icon: UserPlus, role: "campaigns" },
      { title: "Join requirements", url: "/eligibility-rules", icon: ListChecks, role: "campaigns" },
      { title: "Submissions", url: "/submissions", icon: FileVideo, role: "submissions" },
      { title: "Withdrawals", url: "/withdrawals", icon: Banknote, role: "withdrawals" },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Users", url: "/users", icon: Users, role: USERS_ROLE },
      { title: "Verifications", url: "/social-claims", icon: BadgeCheck, role: USERS_ROLE },
      { title: "Feedback", url: "/feedback", icon: MessageSquareWarning, role: "feedback" },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Notifications", url: "/notifications", icon: BellRing, role: "notifications" },
      { title: "Exports", url: "/exports", icon: Download },
      { title: "Admins", url: "/admins", icon: ShieldCheck, role: ADMINS_ROLE },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Action log", url: "/action-logs", icon: ScrollText, superAdmin: true },
      { title: "Integrations", url: "/social", icon: Plug, superAdmin: true },
      { title: "System", url: "/system", icon: Activity, superAdmin: true },
      { title: "Settings", url: "/settings", icon: SlidersHorizontal, superAdmin: true },
    ],
  },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { data: admin } = useAdminMeQuery();

  function visible(items: Section[]): NavItem[] {
    return items.filter((item) => {
      if (!item.role && !item.superAdmin) return true;
      // Until /admin/me resolves, show everything rather than flashing a
      // short sidebar that fills in a moment later.
      if (!admin) return true;

      // RequireSuperAdmin, not RequireRoles - so this is the one check that
      // does not go through hasRole, which treats a super admin as holding
      // every role but says nothing about the reverse.
      if (item.superAdmin) return admin.roles.includes(SUPER_ADMIN_ROLE);

      // Invites are super-admin only, but the rest of /admins needs just the
      // "admins" role, so the section is worth showing to either.
      if (item.role === ADMINS_ROLE) {
        return hasRole(admin, ADMINS_ROLE) || admin.roles.includes(SUPER_ADMIN_ROLE);
      }

      return hasRole(admin, item.role as string);
    });
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-semibold">CT</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">ClipTech</span>
                <span className="truncate text-xs text-muted-foreground">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group, index) => (
          <NavMain
            key={group.label ?? `group-${index}`}
            items={visible(group.items)}
            label={group.label}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
