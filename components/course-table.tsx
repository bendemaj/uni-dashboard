"use client"

import { ChangeEvent, DragEvent, Fragment, useRef, useState } from "react"
import { CourseImportResult, importCoursesFromFile } from "@/lib/import-courses"
import { Course, CourseFormValues, GRADE_COLORS, GRADE_OPTIONS, STATUS_COLORS } from "@/lib/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { CourseActionsMenu } from "@/components/course-actions-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ArrowUpDown, Calendar, ChevronDown, ChevronUp, Download, Trash2, Upload, User } from "lucide-react"

interface CourseTableProps {
  courses: Course[]
  totalCoursesCount: number
  onEditCourse: (course: Course) => void
  onSaveCourse: (values: CourseFormValues, courseId?: string) => void
  onDeleteCourse: (courseId: string) => void
  onImportComplete: (result: CourseImportResult) => void
  onImportError: (message: string) => void
  onClearAll: () => void
}

type SortField = "name" | "credits" | "semester" | "status" | "grade"
type SortDirection = "asc" | "desc"

const ACCEPTED_FILE_TYPES = ".csv,.tsv,.xls,.xlsx,.ods"

export function CourseTable({
  courses,
  totalCoursesCount,
  onEditCourse,
  onSaveCourse,
  onDeleteCourse,
  onImportComplete,
  onImportError,
  onClearAll,
}: CourseTableProps) {
  const [sortField, setSortField] = useState<SortField>("semester")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [isTableOpen, setIsTableOpen] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleImport = async (file: File | null) => {
    if (!file) {
      return
    }

    setIsImporting(true)

    try {
      const result = await importCoursesFromFile(file)
      onImportComplete(result)
      setExpandedRow(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "The file could not be imported."
      onImportError(message)
    } finally {
      setIsImporting(false)
      setIsDragging(false)
    }
  }

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ""
    void handleImport(file)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isImporting) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0] ?? null
    void handleImport(file)
  }

  const getCourseValues = (course: Course, patch: Partial<CourseFormValues> = {}): CourseFormValues => ({
    name: course.name,
    credits: course.credits.toString(),
    semester: course.semester,
    status: course.status,
    grade: course.grade ?? "",
    examDate: course.examDate ?? "",
    examiner: course.examiner ?? "",
    ...patch,
  })

  const saveInlineChange = (course: Course, patch: Partial<CourseFormValues>) => {
    onSaveCourse(getCourseValues(course, patch), course.id)
  }

  const saveTextField = (
    course: Course,
    field: "name" | "credits" | "semester",
    value: string
  ) => {
    const nextValue = field === "semester" ? value.trim().toUpperCase() : value.trim()
    const currentValue =
      field === "credits" ? course.credits.toString() : field === "semester" ? course.semester : course.name

    if (!nextValue || nextValue === currentValue) {
      return
    }

    if (field === "credits") {
      const credits = Number(nextValue)
      if (Number.isNaN(credits) || credits <= 0) {
        return
      }
    }

    saveInlineChange(course, { [field]: nextValue })
  }

  const sortedCourses = [...courses].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "credits":
        comparison = a.credits - b.credits
        break
      case "semester": {
        const [yearA, termA] = [parseInt(a.semester.slice(0, 4)), a.semester.slice(4)]
        const [yearB, termB] = [parseInt(b.semester.slice(0, 4)), b.semester.slice(4)]
        if (yearA !== yearB) {
          comparison = yearA - yearB
        } else {
          comparison = termA === "S" ? -1 : 1
        }
        break
      }
      case "status":
        comparison = a.status.localeCompare(b.status)
        break
      case "grade": {
        const gradeA = a.grade || "zzz"
        const gradeB = b.grade || "zzz"
        comparison = gradeA.localeCompare(gradeB)
        break
      }
    }

    return sortDirection === "asc" ? comparison : -comparison
  })
  const visibleCredits = courses.reduce((sum, course) => sum + course.credits, 0)

  const escapeCsvValue = (value: string | number | null | undefined) => {
    const text = value?.toString() ?? ""
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }

  const handleExportCsv = () => {
    const headers = ["Course", "Semester", "Credits", "Status", "Grade", "Exam Date", "Examiner"]
    const rows = sortedCourses.map((course) => [
      course.name,
      course.semester,
      course.credits,
      course.status === "done" ? "Completed" : "Pending",
      course.grade,
      course.examDate,
      course.examiner,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n")
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `courses-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors group"
    >
      {children}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </button>
  )

  return (
    <Collapsible
      open={isTableOpen}
      onOpenChange={setIsTableOpen}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card transition-all",
        isDragging && "border-foreground shadow-lg ring-2 ring-foreground/15",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileSelection}
      />

      <div
        className={cn(
          "flex flex-col gap-3 bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4",
          isTableOpen && "border-b border-border",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">Course Table</p>
            <span className="rounded-md bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {courses.length} rows
            </span>
            <span className="rounded-md bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {visibleCredits.toFixed(1)} ECTS
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isTableOpen
              ? "Drag and drop a spreadsheet anywhere into this table, or upload one manually."
              : "Table hidden. Export, upload, and clear actions are still available."}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button variant="outline" onClick={() => setIsTableOpen((open) => !open)} className="w-full sm:w-auto">
            {isTableOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {isTableOpen ? "Collapse" : "Expand"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={courses.length === 0 || isImporting}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isImporting}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing..." : "Upload File"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={totalCoursesCount === 0 || isImporting} className="w-full sm:w-auto">
                <Trash2 className="h-4 w-4" />
                Clear Table
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all course data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes every imported or manually added course from the dashboard and resets the statistics.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll}>
                  Clear Table
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/88 backdrop-blur-sm">
            <div className="rounded-2xl border border-dashed border-foreground/30 bg-card px-8 py-10 text-center shadow-xl">
              <Upload className="mx-auto mb-3 h-7 w-7 text-foreground" />
              <p className="text-sm font-medium text-foreground">Drop your CSV or spreadsheet here</p>
              <p className="mt-1 text-xs text-muted-foreground">Supported: CSV, TSV, XLS, XLSX, ODS</p>
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto max-w-sm space-y-3">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {totalCoursesCount === 0 ? "No courses yet" : "No matching courses"}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalCoursesCount === 0
                  ? "Drop a spreadsheet into this table or use Upload File to populate the dashboard."
                  : "Adjust the filters, or replace the current data by dropping in another spreadsheet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <SortButton field="name">Course</SortButton>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    <SortButton field="semester">Semester</SortButton>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <SortButton field="credits">Credits</SortButton>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <SortButton field="status">Status</SortButton>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    <SortButton field="grade">Grade</SortButton>
                  </th>
                  <th className="w-12 px-4 py-3">
                    <span className="sr-only">Course actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedCourses.map((course) => (
                  <Fragment key={course.id}>
                    <tr
                      onClick={() => setExpandedRow(expandedRow === course.id ? null : course.id)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <Input
                          defaultValue={course.name}
                          className="h-8 min-w-[180px] border-transparent bg-transparent px-2 text-sm font-medium shadow-none hover:border-border focus-visible:border-ring sm:min-w-[260px]"
                          onClick={(event) => event.stopPropagation()}
                          onBlur={(event) => saveTextField(course, "name", event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.currentTarget.blur()
                            }
                          }}
                          aria-label={`Course name for ${course.name}`}
                        />
                        <Input
                          defaultValue={course.semester}
                          className="mt-1 h-7 w-24 border-transparent bg-transparent px-2 font-mono text-xs text-muted-foreground shadow-none hover:border-border focus-visible:border-ring md:hidden"
                          onClick={(event) => event.stopPropagation()}
                          onBlur={(event) => saveTextField(course, "semester", event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.currentTarget.blur()
                            }
                          }}
                          aria-label={`Semester for ${course.name}`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <Input
                        defaultValue={course.semester}
                        className="h-8 w-24 border-transparent bg-transparent px-2 font-mono text-sm shadow-none hover:border-border focus-visible:border-ring"
                        onClick={(event) => event.stopPropagation()}
                        onBlur={(event) => saveTextField(course, "semester", event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur()
                          }
                        }}
                        aria-label={`Semester for ${course.name}`}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <Input
                        defaultValue={course.credits.toString()}
                        inputMode="decimal"
                        className="h-8 w-20 border-transparent bg-transparent px-2 text-sm font-medium shadow-none hover:border-border focus-visible:border-ring"
                        onClick={(event) => event.stopPropagation()}
                        onBlur={(event) => saveTextField(course, "credits", event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur()
                          }
                        }}
                        aria-label={`Credits for ${course.name}`}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <Select
                        value={course.status}
                        onValueChange={(value) =>
                          saveInlineChange(course, {
                            status: value as "done" | "pending",
                            grade: value === "pending" ? "" : course.grade ?? "",
                          })
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className={`h-8 w-[108px] border-transparent px-2 text-xs font-medium shadow-none sm:w-[116px] ${STATUS_COLORS[course.status]}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="done">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <Select
                        disabled={course.status !== "done"}
                        value={course.grade ?? "none"}
                        onValueChange={(value) =>
                          saveInlineChange(course, {
                            grade: value === "none" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className={`h-8 w-[152px] border-transparent px-2 text-xs font-medium shadow-none ${
                            course.grade
                              ? GRADE_COLORS[course.grade] || "bg-muted text-muted-foreground"
                              : "text-muted-foreground"
                          }`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <SelectValue placeholder="No grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No grade</SelectItem>
                          {GRADE_OPTIONS.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end">
                        <CourseActionsMenu
                          course={course}
                          onEditCourse={onEditCourse}
                          onDeleteCourse={onDeleteCourse}
                        />
                      </div>
                    </td>
                  </tr>
                  {expandedRow === course.id && (
                    <tr className="bg-muted/20">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="flex flex-wrap gap-6 text-sm">
                          {course.examDate && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Exam: {course.examDate}</span>
                            </div>
                          )}
                          {course.examiner && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>Examiner: {course.examiner}</span>
                            </div>
                          )}
                          <div className="sm:hidden">
                            {course.grade && (
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                                  GRADE_COLORS[course.grade] || "bg-muted text-muted-foreground"
                                }`}
                              >
                                {course.grade}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/20">
                  <td colSpan={6} className="px-4 py-3 text-left">
                    <span className="text-xs font-medium tracking-wider text-muted-foreground">
                      Total Credits:
                    </span>
                    <span className="ml-3 text-xs font-semibold text-foreground">
                      {visibleCredits.toFixed(1)} ECTS
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
