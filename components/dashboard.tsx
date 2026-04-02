"use client"

import { useEffect, useMemo, useState } from "react"
import { courses as initialCourses, getStats, getSemesters } from "@/lib/courses"
import { Course, CourseFormValues } from "@/lib/types"
import { StatsCards } from "./stats-cards"
import { Filters } from "./filters"
import { CourseTable } from "./course-table"
import { SemesterOverview } from "./semester-overview"
import { CourseFormDialog } from "./course-form-dialog"
import { CourseActionsMenu } from "./course-actions-menu"
import { Button } from "@/components/ui/button"
import { GraduationCap, LayoutGrid, List, Plus } from "lucide-react"
import { CourseImportResult } from "@/lib/import-courses"
import { toast } from "@/hooks/use-toast"

const STORAGE_KEY = "student-dashboard-courses"
const CURRENT_SEMESTER_KEY = "student-dashboard-current-semester"
const DEFAULT_CURRENT_SEMESTER = "2026S"

export function Dashboard() {
  const [courseList, setCourseList] = useState<Course[]>(initialCourses)
  const [hasLoadedCourses, setHasLoadedCourses] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [currentSemester, setCurrentSemester] = useState(DEFAULT_CURRENT_SEMESTER)

  useEffect(() => {
    const storedCourses = window.localStorage.getItem(STORAGE_KEY)

    if (!storedCourses) {
      setHasLoadedCourses(true)
      return
    }

    try {
      const parsedCourses = JSON.parse(storedCourses) as Course[]
      if (Array.isArray(parsedCourses)) {
        setCourseList(parsedCourses)
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    } finally {
      const storedCurrentSemester = window.localStorage.getItem(CURRENT_SEMESTER_KEY)
      if (storedCurrentSemester) {
        setCurrentSemester(storedCurrentSemester)
      }

      setHasLoadedCourses(true)
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedCourses) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courseList))
    window.localStorage.setItem(CURRENT_SEMESTER_KEY, currentSemester)
  }, [courseList, currentSemester, hasLoadedCourses])

  useEffect(() => {
    if (selectedSemester !== "all" && !courseList.some((course) => course.semester === selectedSemester)) {
      setSelectedSemester("all")
    }
  }, [courseList, selectedSemester])

  const semesters = useMemo(() => getSemesters(courseList), [courseList])

  useEffect(() => {
    if (semesters.length === 0) {
      return
    }

    if (currentSemester !== "all" && !semesters.includes(currentSemester)) {
      const fallbackSemester = semesters.includes(DEFAULT_CURRENT_SEMESTER)
        ? DEFAULT_CURRENT_SEMESTER
        : semesters[semesters.length - 1]
      setCurrentSemester(fallbackSemester)
    }
  }, [currentSemester, semesters])

  const filteredCourses = useMemo(() => {
    return courseList.filter((course) => {
      const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.examiner?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesSemester = selectedSemester === "all" || course.semester === selectedSemester
      const matchesStatus = selectedStatus === "all" || course.status === selectedStatus
      return matchesSearch && matchesSemester && matchesStatus
    })
  }, [courseList, searchQuery, selectedSemester, selectedStatus])

  const allStats = useMemo(() => getStats(courseList), [courseList])

  const openAddDialog = () => {
    setEditingCourse(null)
    setIsDialogOpen(true)
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setIsDialogOpen(true)
  }

  const handleDeleteCourse = (courseId: string) => {
    const courseToDelete = courseList.find((course) => course.id === courseId)
    if (!courseToDelete) {
      return
    }

    const confirmed = window.confirm(`Delete "${courseToDelete.name}" from the dashboard?`)
    if (!confirmed) {
      return
    }

    setCourseList((current) => current.filter((course) => course.id !== courseId))
  }

  const handleSaveCourse = (values: CourseFormValues, courseId?: string) => {
    const nextCourse: Course = {
      id: courseId ?? crypto.randomUUID(),
      name: values.name,
      credits: Number(values.credits),
      semester: values.semester,
      status: values.status,
      grade: values.status === "done" && values.grade ? values.grade : null,
      examDate: values.examDate || null,
      examiner: values.examiner || null,
    }

    setCourseList((current) => {
      if (!courseId) {
        return [...current, nextCourse]
      }

      return current.map((course) => (course.id === courseId ? nextCourse : course))
    })

    setIsDialogOpen(false)
    setEditingCourse(null)
  }

  const handleImportComplete = ({ courses, skippedRows, fileName }: CourseImportResult) => {
    setCourseList(courses)
    setSelectedSemester("all")
    setSelectedStatus("all")
    setSearchQuery("")

    const description = skippedRows > 0
      ? `${courses.length} courses imported from ${fileName}. ${skippedRows} row${skippedRows === 1 ? "" : "s"} skipped.`
      : `${courses.length} courses imported from ${fileName}.`

    toast({
      title: "Import complete",
      description,
    })
  }

  const handleImportError = (message: string) => {
    toast({
      title: "Import failed",
      description: message,
      variant: "destructive",
    })
  }

  const handleClearAllCourses = () => {
    setCourseList([])
    setSelectedSemester("all")
    setSelectedStatus("all")
    setSearchQuery("")
    setCurrentSemester("all")

    toast({
      title: "Table cleared",
      description: "All courses were removed from the dashboard.",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
                <GraduationCap className="h-5 w-5 text-background" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Student Dashboard</h1>
                <p className="text-xs text-muted-foreground">TU Wien - Electrical Engineering</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === "cards"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          <StatsCards stats={allStats} />

          {/* Combined Progress Overview */}
          <div>
            <SemesterOverview
              courses={courseList}
              semesters={semesters}
              currentSemester={currentSemester}
              onCurrentSemesterChange={setCurrentSemester}
            />
          </div>

          {/* Courses Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">All Courses</h2>
              <div className="flex flex-col gap-3 sm:items-end">
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
                <Filters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedSemester={selectedSemester}
                  setSelectedSemester={setSelectedSemester}
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  semesters={semesters}
                />
              </div>
            </div>

            {viewMode === "table" ? (
              <CourseTable
                courses={filteredCourses}
                totalCoursesCount={courseList.length}
                onEditCourse={handleEditCourse}
                onDeleteCourse={handleDeleteCourse}
                onImportComplete={handleImportComplete}
                onImportError={handleImportError}
                onClearAll={handleClearAllCourses}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-border bg-card p-4 hover:border-border/80 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2">
                        {course.name}
                      </h3>
                      <div className="flex items-start gap-1">
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            course.status === "done"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {course.status === "done" ? "Done" : "Pending"}
                        </span>
                        <CourseActionsMenu
                          course={course}
                          onEditCourse={handleEditCourse}
                          onDeleteCourse={handleDeleteCourse}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono">{course.semester}</span>
                      <span>{course.credits} ECTS</span>
                      {course.grade && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {course.grade}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground pt-2">
              Showing {filteredCourses.length} of {courseList.length} courses
            </div>
          </div>
        </div>
      </main>

      <CourseFormDialog
        course={editingCourse}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingCourse(null)
          }
        }}
        onSave={handleSaveCourse}
      />
    </div>
  )
}
