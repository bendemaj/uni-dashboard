"use client"

import { Stats } from "@/lib/types"
import { BookOpen, CheckCircle2, GraduationCap } from "lucide-react"

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const totalCourses = stats.completedCourses + stats.pendingCourses
  const creditProgress =
    stats.totalCredits > 0 ? (stats.completedCredits / stats.totalCredits) * 100 : 0
  const gradePosition = stats.averageGrade
    ? Math.min(Math.max(((stats.averageGrade - 1) / 3) * 100, 0), 100)
    : null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-border/80 hover:shadow-sm sm:p-6 lg:col-span-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Completed Credits</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="text-4xl font-semibold tracking-tight text-foreground">
                {stats.completedCredits.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">
                / {stats.totalCredits.toFixed(1)} ECTS
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              {creditProgress.toFixed(0)}% complete
            </span>
            <span className="text-muted-foreground">
              {stats.pendingCredits.toFixed(1)} ECTS pending
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${creditProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.pendingCourses} courses left to finish
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-border/80 hover:shadow-sm sm:p-6 lg:col-span-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Average Grade</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
              {stats.averageGrade ? stats.averageGrade.toFixed(2) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.averageGrade ? "Weighted by ECTS credits" : "No graded courses yet"}
            </p>
          </div>
          <div className="rounded-lg bg-violet-500/10 p-2.5">
            <GraduationCap className="h-5 w-5 text-violet-500" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-1.5 text-center text-[11px] text-muted-foreground">
          <div className="col-span-4">
            <div className="relative h-2 rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 w-1/3 rounded-l-full bg-emerald-500/70" />
              <div className="absolute inset-y-0 left-1/3 w-1/3 bg-teal-500/60" />
              <div className="absolute inset-y-0 right-0 w-1/3 rounded-r-full bg-amber-500/70" />
              {gradePosition !== null && (
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground shadow-sm"
                  style={{ left: `${gradePosition}%` }}
                />
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>1 best</span>
              <span>4 pass</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 hover:shadow-sm lg:col-span-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Courses Completed</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {stats.completedCourses}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">of {totalCourses} total</p>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs">
          <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-medium text-emerald-700 dark:text-emerald-300">
            {stats.completedCourses} done
          </span>
          <span className="rounded-md bg-amber-500/10 px-2 py-1 font-medium text-amber-700 dark:text-amber-300">
            {stats.pendingCourses} pending
          </span>
        </div>
      </div>
    </div>
  )
}
