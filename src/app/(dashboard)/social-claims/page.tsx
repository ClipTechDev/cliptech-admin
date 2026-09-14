import { PageHeader } from "@/components/shared/page-header";
import { SocialClaims } from "@/components/social/social-claims";

/**
 * Open bio-code verifications, under People rather than Integrations.
 *
 * The endpoint is behind the "users" role, and /social is super admin only, so
 * mounting it there would have left support with the access and no screen. The
 * tickets this answers are support's: a creator saying somebody else has
 * claimed their handle, or that their own code will not verify.
 */
export default function SocialClaimsPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Account verifications"
        description="Creators part-way through proving a social account with a code in their bio. Release one to free a handle that is blocking its real owner."
      />
      <SocialClaims />
    </div>
  );
}
