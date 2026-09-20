import { PageHeader } from "@/components/shared/page-header";
import { JoinRequests } from "@/components/eligibility/join-requests";

export default function JoinRequestsPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Join requests"
        description="Pages asking to join a campaign. Approve them to let the creator submit clips, or decline with a reason."
      />
      <JoinRequests />
    </div>
  );
}
