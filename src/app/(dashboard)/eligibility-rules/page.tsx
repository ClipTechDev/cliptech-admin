import { PageHeader } from "@/components/shared/page-header";
import { RuleTypesList } from "@/components/eligibility/rule-types-list";

export default function EligibilityRulesPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Join requirements"
        description="The requirements you can add to a campaign to decide which pages may join it."
      />
      <RuleTypesList />
    </div>
  );
}
