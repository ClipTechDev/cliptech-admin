import { formatCurrency, formatNumber } from "@/lib/format";
import { budgetUsedPercent, committed, type Campaign } from "@/schemas/campaign";

/**
 * Where the budget stands, as one bar.
 *
 * The distinction it exists to make is spent vs accrued: both are committed
 * money the budget has to cover, but only spent has actually reached
 * creators. A single "used" bar would hide that, and it is the difference
 * between a campaign that owes nothing and one that owes thousands.
 *
 * Not a chart - it is a meter, so it carries its numbers as text rather than
 * an axis, and every figure in it is also printed below.
 */
export function CampaignBudget({ campaign }: { campaign: Campaign }) {
  const total = campaign.total_budget;
  const pct = (value: number) => (total > 0 ? Math.min((value / total) * 100, 100) : 0);

  const spentPct = pct(campaign.spent_amount);
  const accruedPct = Math.max(0, Math.min(pct(committed(campaign)) - spentPct, 100 - spentPct));
  const usedPct = budgetUsedPercent(campaign);
  const cutoff = campaign.submission_cutoff_percent;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-medium">Budget</p>
        <p className="text-muted-foreground text-sm tabular-nums">
          {formatCurrency(committed(campaign))} of {formatCurrency(total)} committed (
          {formatNumber(Math.round(usedPct))}%)
        </p>
      </div>

      <div className="relative">
        <div
          className="bg-muted flex h-3 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={`${formatCurrency(campaign.spent_amount)} paid out and ${formatCurrency(
            campaign.accrued_amount
          )} accrued, of ${formatCurrency(total)}`}
        >
          <div className="bg-primary h-full" style={{ width: `${spentPct}%` }} />
          {/* A 2px surface gap keeps the two segments legible where they meet. */}
          {accruedPct > 0 && (
            <div
              className="bg-primary/40 border-background h-full border-l-2"
              style={{ width: `${accruedPct}%` }}
            />
          )}
        </div>

        {/* The submission cutoff: past this share of budget no new posts are
            taken, leaving the rest for entries already in. */}
        {cutoff > 0 && cutoff < 100 && (
          <div
            className="bg-foreground/40 absolute inset-y-0 w-px"
            style={{ left: `${cutoff}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <Figure label="Paid out" value={formatCurrency(campaign.spent_amount)} swatch="bg-primary" />
        <Figure
          label="Accrued"
          value={formatCurrency(campaign.accrued_amount)}
          swatch="bg-primary/40"
          hint="earned, not yet credited"
        />
        <Figure
          label="Remaining"
          value={formatCurrency(campaign.remaining_budget)}
          swatch="bg-muted"
        />
        <Figure
          label="Cutoff"
          value={`${cutoff}%`}
          hint={campaign.cutoff_reached ? "reached" : "not reached"}
        />
      </dl>
    </div>
  );
}

function Figure({
  label,
  value,
  swatch,
  hint,
}: {
  label: string;
  value: string;
  swatch?: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {swatch && <span className={`size-2 shrink-0 rounded-full ${swatch}`} aria-hidden="true" />}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-0.5 truncate font-medium tabular-nums">{value}</dd>
      {hint && <dd className="text-muted-foreground truncate text-xs">{hint}</dd>}
    </div>
  );
}
