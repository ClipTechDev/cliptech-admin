"use client";

import { useAdminDashboardQuery } from "@/hooks/use-dashboard";
import { RefreshButton } from "@/components/shared/refresh-button";

export function DashboardRefresh() {
  const { isFetching, dataUpdatedAt, refetch } = useAdminDashboardQuery();

  return (
    <RefreshButton
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
      updatedAt={dataUpdatedAt}
    />
  );
}
