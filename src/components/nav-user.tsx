"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, User } from "lucide-react";

import { useAdminMeQuery, useLogoutMutation } from "@/hooks/use-admin";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { data: admin } = useAdminMeQuery();
  const logoutMutation = useLogoutMutation();

  async function logout() {
    // Clearing the cache would only hide the session; the cookie is HttpOnly,
    // so it has to be the API that ends it. onSettled drops the cache either
    // way, and the redirect lands on a page middleware will re-guard.
    await logoutMutation.mutateAsync().catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  const displayName = admin?.name ?? "Guest";
  const displayEmail = admin?.email ?? "Not signed in";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="rounded-lg">
              <AvatarFallback className="rounded-lg">
                {admin ? initials(displayName) : <User className="size-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1.5 py-1.5 text-left text-sm">
                <Avatar className="rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {admin ? initials(displayName) : <User className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                  {admin && admin.roles.length > 0 && (
                    <span className="truncate text-xs text-muted-foreground">
                      {admin.roles.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={logoutMutation.isPending}
              onClick={() => void logout()}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
