"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, humanise, platformLabel } from "@/lib/format";
import { errorMessage } from "@/components/shared/query-state";
import {
  useCreateCampaignMutation,
  useSetCampaignBannerMutation,
  useUpdateCampaignMutation,
} from "@/hooks/use-campaigns";
import { useAdminMeQuery } from "@/hooks/use-admin";
import { SUPER_ADMIN_ROLE } from "@/schemas/admin";
import {
  APPROVAL_THRESHOLD,
  budgetNeedsApproval,
  campaignEditSchema,
  campaignFormDefaults,
  campaignFormDiff,
  campaignFormSchema,
  isDraft,
  isTerminal,
  type Campaign,
  type CampaignFormValues,
} from "@/schemas/campaign";
import { SOCIAL_PLATFORMS } from "@/schemas/social-account";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import {
  ImageUploadField,
  type ImageUploadFieldHandle,
} from "@/components/shared/image-upload-field";

const platformOptions = SOCIAL_PLATFORMS.map((platform) => ({
  value: platform,
  label: platformLabel(platform),
}));

/**
 * Create and edit in one form, because the API's own rules are what differ
 * between them, not the fields.
 *
 * Once a campaign leaves draft the terms creators signed up to freeze - CPM,
 * the platforms, the start date (ErrFrozenField) - and the budget may only
 * grow (ErrBudgetCannotShrink). Those inputs are disabled with the reason
 * shown, rather than left editable for the API to reject: an admin should not
 * have to submit to find out a field was never theirs to change.
 */
export function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const router = useRouter();
  const editing = Boolean(campaign);
  const draft = !editing || isDraft(campaign);
  const frozen = editing && !draft;

  const schema = React.useMemo(
    () => (campaign ? campaignEditSchema(campaign) : campaignFormSchema),
    [campaign]
  );

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(schema),
    defaultValues: campaignFormDefaults(campaign),
  });

  const create = useCreateCampaignMutation();
  const update = useUpdateCampaignMutation(campaign ?? ({ id: "" } as Campaign));
  const setBanner = useSetCampaignBannerMutation();

  // The banner upload is a file, not a form field, and its endpoint needs the
  // campaign to exist. ImageUploadField owns the file, preview and validation;
  // it's committed from the submit handlers once there's an id to point it at.
  const bannerRef = React.useRef<ImageUploadFieldHandle>(null);
  const [bannerPending, setBannerPending] = React.useState(false);
  const [bannerBusy, setBannerBusy] = React.useState(false);
  // Set from the create response so `uploadBanner` has an id in the new-campaign
  // flow, where `campaign` is undefined.
  const createdIdRef = React.useRef<string | null>(null);

  const uploadBanner = async (file: File): Promise<string> => {
    const id = campaign?.id ?? createdIdRef.current;
    if (!id) throw new Error("no campaign to attach the banner to");
    const response = await setBanner.mutateAsync({ id, file });
    return response.campaign.banner_url ?? "";
  };

  React.useEffect(() => {
    if (campaign) {
      // The record is the source of truth: on a fresh copy (after a save, or a
      // refetch elsewhere) re-seed the form and drop any staged banner too.
      form.reset(campaignFormDefaults(campaign));
      bannerRef.current?.reset();
      setBannerPending(false);
    }
  }, [campaign, form]);

  const { data: me } = useAdminMeQuery();
  const isSuperAdmin = me?.roles.includes(SUPER_ADMIN_ROLE) ?? false;

  const values = form.watch();
  const needsApproval =
    !isSuperAdmin &&
    budgetNeedsApproval(values.total_budget, campaign?.approved_budget ?? null);
  const hasChanges = campaign
    ? Object.keys(campaignFormDiff(values, campaign)).length > 0 || bannerPending
    : true;
  const pending = create.isPending || update.isPending || bannerBusy;

  function onCreate(submitted: CampaignFormValues, status: "draft" | "active") {
    create.mutate(
      { values: submitted, status },
      {
        onSuccess: async (response) => {
          const id = response.campaign.id;
          createdIdRef.current = id;
          if (bannerRef.current?.hasPendingFile) {
            try {
              await bannerRef.current.commit();
            } catch {
              toast.warning(
                "Campaign saved, but the banner didn't upload. Add it from the campaign page."
              );
              router.push(`/campaigns/${id}`);
              return;
            }
          }
          toast.success(status === "draft" ? "Draft saved" : "Campaign created and live");
          router.push(`/campaigns/${id}`);
        },
        onError: (error) => toast.error(errorMessage(error)),
      }
    );
  }

  async function onUpdate(submitted: CampaignFormValues) {
    if (!campaign) return;
    const diff = campaignFormDiff(submitted, campaign);
    // The API answers an empty patch with ErrNoChanges, so a no-op save is
    // stopped here rather than turned into a confusing 400.
    if (Object.keys(diff).length === 0 && !bannerRef.current?.hasPendingFile) {
      toast.info("Nothing to save");
      return;
    }
    try {
      await bannerRef.current?.commit();
      if (Object.keys(diff).length > 0) {
        await update.mutateAsync(submitted);
      }
      toast.success("Campaign updated");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  if (campaign && isTerminal(campaign)) {
    return (
      <p className="text-muted-foreground max-w-2xl rounded-lg border border-dashed p-6 text-sm">
        A {humanise(campaign.status).toLowerCase()} campaign can no longer be edited. Its
        submissions and payout history stay readable on the other tabs.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(editing ? onUpdate : (v) => onCreate(v, "draft"))}
        className="max-w-3xl space-y-8"
      >
        <Fieldset legend="Basics">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Summer clip push" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="banner_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banner image</FormLabel>
                <FormControl>
                  {/* The picked file is committed from the submit handlers, once
                      there's a campaign id. Remove sets the field to "" so the
                      diff sends `banner_url: ""` and the API drops it on save. */}
                  <ImageUploadField
                    ref={bannerRef}
                    value={field.value || null}
                    upload={uploadBanner}
                    onChange={(url) => field.onChange(url ?? "")}
                    onPendingChange={setBannerPending}
                    onBusyChange={setBannerBusy}
                    disabled={pending}
                  />
                </FormControl>
                <FormDescription>
                  Optional. JPEG, PNG or WebP, up to 5MB. Shown to creators on the campaign
                  page.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="What the campaign is for." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rules</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="What a post must do to qualify." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content_links"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content links</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="https://…&#10;https://…" {...field} />
                </FormControl>
                <FormDescription>
                  One http(s) link per line, up to 20. The source material creators clip from.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hashtags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required hashtags</FormLabel>
                <FormControl>
                  <Input placeholder="SummerDrop, sneakers, ad" {...field} />
                </FormControl>
                <FormDescription>
                  Up to 10, separated by commas or spaces. The leading # is optional and
                  is stripped — creators see it added back. Shown on the campaign page;
                  posts are not checked against it automatically.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Fieldset>

        <Fieldset legend="Payout terms">
          <FormField
            control={form.control}
            name="allowed_platforms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Allowed platforms
                  {frozen && <FrozenHint />}
                </FormLabel>
                <FormControl>
                  <CheckboxGroup
                    name="platforms"
                    options={platformOptions}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={frozen}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cpm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    CPM
                    {frozen && <FrozenHint />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      disabled={frozen}
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>Paid per 1,000 payable views.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="total_budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total budget</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      // Once live the budget can only grow, and never below
                      // what has already been paid out.
                      min={frozen ? campaign?.total_budget : (campaign?.spent_amount ?? 0)}
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  {frozen && (
                    <FormDescription>
                      Can only be increased once a campaign has left draft — currently{" "}
                      {formatCurrency(campaign?.total_budget)}.
                    </FormDescription>
                  )}
                  {needsApproval && (
                    <FormDescription className="text-foreground">
                      Above {formatCurrency(APPROVAL_THRESHOLD)}, so a super admin has to
                      approve it before the campaign can go live.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minimum_views"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum views</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="No minimum"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === "" ? "" : event.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>A post below this earns nothing.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_payout_per_post"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max payout per post</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="No cap"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === "" ? "" : event.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>Caps what a single post can earn.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="submission_cutoff_percent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submission cutoff</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    className="sm:w-40"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>
                  Percent of budget after which no new posts are taken, leaving the rest
                  for entries already in.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Fieldset>

        <Fieldset legend="Schedule">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="starts_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Starts
                    {frozen && <FrozenHint />}
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" disabled={frozen} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ends_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ends</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    At least an hour after the start, and in the future.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Fieldset>

        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <Button type="submit" disabled={pending || !hasChanges}>
                {pending ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending || !hasChanges}
                onClick={() => {
                  form.reset(campaignFormDefaults(campaign));
                  bannerRef.current?.reset();
                }}
              >
                Discard
              </Button>
            </>
          ) : (
            <>
              {/* Two submits, because the API takes the starting status on
                  create and it is a real decision: a draft is invisible to
                  creators, an active campaign is live the moment it saves. */}
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save as draft"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={form.handleSubmit((v) => onCreate(v, "active"))}
              >
                {needsApproval ? "Create and send for approval" : "Create and go live"}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-6">
      <legend className="mb-4 text-sm font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

function FrozenHint() {
  return (
    <span className="text-muted-foreground ml-2 inline-flex items-center gap-1 text-xs font-normal">
      <Lock className="size-3" />
      draft only
    </span>
  );
}
