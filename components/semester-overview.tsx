"use client"

import { useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Course, GRADE_MAP } from "@/lib/types"

interface SemesterOverviewProps {
  courses: Course[]
  semesters: string[]
  currentSemester: string
  onCurrentSemesterChange: (semester: string) => void
}

export function SemesterOverview({
  courses,
  semesters,
  currentSemester,
  onCurrentSemesterChange,
}: SemesterOverviewProps) {
  const semesterData = useMemo(() => {
    const buildSummary = (semester: string, semCourses: Course[]) => {
      const completed = semCourses.filter((c) => c.status === "done")
      const totalCredits = semCourses.reduce((sum, c) => sum + c.credits, 0)
      const completedCredits = completed.reduce((sum, c) => sum + c.credits, 0)
      const pendingCredits = totalCredits - completedCredits
      const progress = totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0

      const gradedCourses = completed.filter((c) => c.grade && GRADE_MAP[c.grade])
      let avgGrade: number | null = null
      if (gradedCourses.length > 0) {
        const totalWeighted = gradedCourses.reduce(
          (sum, c) => sum + GRADE_MAP[c.grade!] * c.credits,
          0
        )
        const totalGradedCredits = gradedCourses.reduce((sum, c) => sum + c.credits, 0)
        avgGrade = totalWeighted / totalGradedCredits
      }

      return {
        semester,
        totalCredits,
        completedCredits,
        pendingCredits,
        progress,
        courseCount: semCourses.length,
        completedCount: completed.length,
        avgGrade,
      }
    }

    const perSemester = [...semesters].reverse().map((semester) =>
      buildSummary(semester, courses.filter((c) => c.semester === semester))
    )

    return [buildSummary("all", courses), ...perSemester]
  }, [courses, semesters])

  const currentSemesterData = semesterData.find((semester) => semester.semester === currentSemester) ?? null

  const renderSemesterRow = (data: (typeof semesterData)[number]) => {
    return (
      <div key={data.semester} className="px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5">
        <div className="mb-3 flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <span className="text-sm font-medium text-foreground">
              {data.semester === "all" ? "All semesters" : <span className="font-mono">{data.semester}</span>}
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{data.completedCount}/{data.courseCount} courses</span>
              {data.avgGrade && (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Avg {data.avgGrade.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold leading-none text-foreground">
              {data.progress.toFixed(0)}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">complete</p>
          </div>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all"
            style={{ width: `${data.progress}%` }}
          />
        </div>
        <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <span>{data.completedCredits.toFixed(2)} / {data.totalCredits.toFixed(2)} ECTS</span>
          <span>{data.pendingCredits.toFixed(2)} ECTS remaining</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">Study Progress</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={currentSemester} onValueChange={onCurrentSemesterChange}>
            <SelectTrigger className="w-full min-[420px]:w-[120px]" size="sm">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester} value={semester}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        {currentSemesterData ? (
          renderSemesterRow(currentSemesterData)
        ) : (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            No courses found for <span className="font-mono">{currentSemester}</span>.
          </div>
        )}
      </div>
    </div>
  )
}
