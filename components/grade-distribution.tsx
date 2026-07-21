"use client"

import { GradeDistributionEntry } from "@/lib/courses"

interface GradeDistributionProps {
  data: GradeDistributionEntry[]
}

const gradeColors: Record<string, string> = {
  sehrGut: "bg-emerald-600 dark:bg-emerald-300",
  gut: "bg-emerald-500 dark:bg-emerald-400",
  befriedigend: "bg-teal-500 dark:bg-teal-400",
  genuegend: "bg-amber-500 dark:bg-amber-300",
  ohneNote: "bg-slate-500 dark:bg-slate-300",
}

export function GradeDistribution({ data }: GradeDistributionProps) {
  const totalGraded = data.reduce((sum, entry) => sum + entry.count, 0)
  const maxCount = Math.max(...data.map((entry) => entry.count), 1)

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">Grade Distribution</h3>
        <span className="text-xs text-muted-foreground">{totalGraded} graded</span>
      </div>

      {totalGraded === 0 ? (
        <div className="flex min-h-[116px] items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
          No graded courses yet.
        </div>
      ) : (
        <div className="grid gap-2">
          {data.map((entry) => (
            <div key={entry.key} className="grid grid-cols-[72px_1fr_24px] items-center gap-2 text-xs sm:grid-cols-[88px_1fr_24px] sm:gap-3">
              <span className="truncate text-muted-foreground">{entry.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${gradeColors[entry.key]}`}
                  style={{ width: `${(entry.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-right font-medium text-foreground">{entry.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
