import { PageHeader } from "@/components/shared/page-header";
import { NewAdminForm } from "@/components/admins/new-admin-form";

/**
 * Nothing is prefetched: the form's only server data is the signed-in admin,
 * which the dashboard layout has already put in the cache to decide which of
 * the two creation paths this account may use.
 */
export default function NewAdminPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="New admin"
        description="Invite them and let the API email a generated password, or set one yourself."
      />
      <NewAdminForm />
    </div>
  );
}
