import { PageHeader } from "@/components/shared/page-header";
import { CampaignForm } from "@/components/campaigns/campaign-form";

/**
 * Nothing to prefetch - a new campaign has no server state. The form decides
 * between draft and live at submit time, since that is what the API takes.
 */
export default function NewCampaignPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <PageHeader
        title="New campaign"
        description="Save it as a draft to keep working on it, or go live straight away. CPM, platforms and the start date freeze once it leaves draft."
      />
      <CampaignForm />
    </div>
  );
}
