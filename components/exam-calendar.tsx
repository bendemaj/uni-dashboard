"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CheckCircle2, ChevronDown } from "lucide-react"
import { Course, GRADE_COLORS } from "@/lib/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ExamCalendarProps {
  courses: Course[]
}

interface PassedExam {
  course: Course
  date: Date
  day: number
  month: number
  year: number
}

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function parseExamDate(value: string | null): Date | null {
  if (!value) {
    return null
  }

  const match = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (!match) {
    return null
  }

  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null
  }

  return date
}

export function ExamCalendar({ courses }: ExamCalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const passedExams = useMemo<PassedExam[]>(() => {
    return courses
      .filter((course) => course.status === "done")
      .map((course) => {
        const date = parseExamDate(course.examDate)
        if (!date) {
          return null
        }

        return {
          course,
          date,
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
        }
      })
      .filter((exam): exam is PassedExam => exam !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [courses])

  const years = useMemo(() => {
    return Array.from(new Set(passedExams.map((exam) => exam.year))).sort((a, b) => b - a)
  }, [passedExams])

  const [selectedYear, setSelectedYear] = useState<string>("latest")
  const activeYear = selectedYear === "latest" ? years[0] : Number(selectedYear)

  const examsForYear = passedExams.filter((exam) => exam.year === activeYear)
  const examsByMonth = monthLabels.map((_, month) =>
    examsForYear.filter((exam) => exam.month === month)
  )
  const busiestMonth = Math.max(...examsByMonth.map((exams) => exams.length), 1)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-medium text-foreground">Exam Calendar</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {years.length === 0
                ? "No passed exams with dates yet"
                : `${passedExams.length} passed exams across ${years.length} year${years.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {years.length > 0 && isOpen && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[128px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="latest">Latest year</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <CollapsibleTrigger className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {isOpen ? "Hide calendar" : "Show calendar"}
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="border-t border-border px-5 py-5">
          {years.length === 0 ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
          No passed exams with dates yet.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {monthLabels.map((month, index) => {
              const exams = examsByMonth[index]
              const intensity = exams.length / busiestMonth

              return (
                <div
                  key={month}
                  className="min-h-[92px] rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{month}</span>
                    <span className="text-xs text-muted-foreground">{exams.length}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.max(intensity * 100, exams.length > 0 ? 14 : 0)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exams.slice(0, 6).map((exam) => (
                      <span
                        key={exam.course.id}
                        className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-emerald-500/10 px-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                        title={exam.course.name}
                      >
                        {exam.day}
                      </span>
                    ))}
                    {exams.length > 6 && (
                      <span className="inline-flex h-6 items-center rounded-md bg-muted px-1.5 text-[11px] text-muted-foreground">
                        +{exams.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-lg border border-border bg-muted/20">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">{activeYear} passed exams</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {examsForYear.length} completed with exam dates
              </p>
            </div>
            <div className="max-h-[340px] overflow-y-auto">
              {examsForYear.length === 0 ? (
                <div className="px-4 py-8 text-sm text-muted-foreground">
                  No exams recorded for this year.
                </div>
              ) : (
                examsForYear.map((exam) => (
                  <div key={exam.course.id} className="border-b border-border/70 px-4 py-3 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {exam.day}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-medium text-foreground">
                            {exam.course.name}
                          </p>
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{monthLabels[exam.month]} {exam.day}</span>
                          <span className="font-mono">{exam.course.semester}</span>
                          {exam.course.grade && (
                            <span className={`rounded-md px-2 py-0.5 font-medium ${GRADE_COLORS[exam.course.grade] || "bg-muted text-muted-foreground"}`}>
                              {exam.course.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
