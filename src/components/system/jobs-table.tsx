import { cn } from "@/lib/utils";
import { formatDateTime, formatDuration, formatInterval, formatNumber, humanise } from "@/lib/format";
import { jobHealth, type JobHealth, type WorkerJob } from "@/schemas/system";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const labels: Record<JobHealth, string> = {
  failing: "Failing",
  stale: "Stale",
  idle: "Never run",
  ok: "OK",
};

const variants: Record<JobHealth, "default" | "secondary" | "destructive" | "outline"> = {
  failing: "destructive",
  stale: "destructive",
  idle: "outline",
  ok: "default",
};

/**
 * One row per job. Every column answers something somebody asks while looking
 * at a job that has gone wrong: when did it last work, how long does it take,
 * how many times has it failed in a row, and what did it say.
 *
 * The error gets its own line under the job name rather than a column: it is
 * by far the longest value here and the one most worth reading whole.
 */
export function JobsTable({ jobs }: { jobs: WorkerJob[] }) {
  if (jobs.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        No job has reported in yet. Workers write their first heartbeat on their first run.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Every</TableHead>
            <TableHead>Last run</TableHead>
            <TableHead>Last success</TableHead>
            <TableHead className="text-right">Took</TableHead>
            <TableHead className="text-right">Failures</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const health = jobHealth(job);

            return (
              <TableRow key={job.name}>
                <TableCell className="align-top">
                  <p className="font-medium">{humanise(job.name)}</p>
                  {job.last_error && (
                    <p className="text-destructive mt-1 max-w-md text-xs break-words">
                      {job.last_error}
                      <span className="text-muted-foreground">
                        {" · "}
                        {formatDateTime(job.last_error_at)}
                      </span>
                    </p>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant={variants[health]}>{labels[health]}</Badge>
                </TableCell>
                <TableCell className="align-top whitespace-nowrap">
                  {formatInterval(job.interval_seconds)}
                </TableCell>
                <TableCell className="text-muted-foreground align-top whitespace-nowrap">
                  {formatDateTime(job.last_run_at)}
                </TableCell>
                <TableCell className="text-muted-foreground align-top whitespace-nowrap">
                  {formatDateTime(job.last_success_at)}
                </TableCell>
                <TableCell className="align-top text-right tabular-nums">
                  {formatDuration(job.last_duration_ms)}
                </TableCell>
                <TableCell
                  className={cn(
                    "align-top text-right tabular-nums",
                    job.consecutive_failures > 0 && "text-destructive font-medium"
                  )}
                >
                  {formatNumber(job.consecutive_failures)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
