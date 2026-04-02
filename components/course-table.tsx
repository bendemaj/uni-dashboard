"use client"

import { ChangeEvent, DragEvent, Fragment, useRef, useState } from "react"
import { CourseImportResult, importCoursesFromFile } from "@/lib/import-courses"
import { Course, GRADE_COLORS, STATUS_COLORS } from "@/lib/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { CourseActionsMenu } from "@/components/course-actions-menu"
import { cn } from "@/lib/utils"
import { ArrowUpDown, Calendar, ChevronDown, ChevronUp, Trash2, Upload, User } from "lucide-react"

interface CourseTableProps {
  courses: Course[]
  totalCoursesCount: number
  onEditCourse: (course: Course) => void
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
  onDeleteCourse,
  onImportComplete,
  onImportError,
  onClearAll,
}: CourseTableProps) {
  const [sortField, setSortField] = useState<SortField>("semester")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
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
    <div
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

      <div className="flex flex-col gap-4 border-b border-border bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Course Table</p>
          <p className="text-xs text-muted-foreground">
            Drag and drop a spreadsheet anywhere into this table, or upload one manually.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={isImporting}>
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing..." : "Upload File"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={totalCoursesCount === 0 || isImporting}>
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
                        <span className="text-sm font-medium text-foreground group-hover:text-foreground/90 line-clamp-2">
                          {course.name}
                        </span>
                        <span className="text-xs text-muted-foreground md:hidden mt-0.5">
                          {course.semester}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-foreground font-mono">{course.semester}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-foreground font-medium">{course.credits}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                          STATUS_COLORS[course.status]
                        }`}
                      >
                        {course.status === "done" ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      {course.grade ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                            GRADE_COLORS[course.grade] || "bg-muted text-muted-foreground"
                          }`}
                        >
                          {course.grade}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
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
          </table>
        </div>
      )}
    </div>
  )
}
