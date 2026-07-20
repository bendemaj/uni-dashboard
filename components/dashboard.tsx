"use client"

import { useEffect, useMemo, useState } from "react"
import { courses as initialCourses, getStats, getSemesters, getGradeDistribution } from "@/lib/courses"
import { Course, CourseFormValues } from "@/lib/types"
import { StatsCards } from "./stats-cards"
import { Filters } from "./filters"
import { CourseTable } from "./course-table"
import { SemesterOverview } from "./semester-overview"
import { GradeDistribution } from "./grade-distribution"
import { ExamCalendar } from "./exam-calendar"
import { CourseFormDialog } from "./course-form-dialog"
import { CourseActionsMenu } from "./course-actions-menu"
import { Button } from "@/components/ui/button"
import { Cloud, Github, GraduationCap, Loader2, LogOut, Plus } from "lucide-react"
import { CourseImportResult } from "@/lib/import-courses"
import { toast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { CloudSyncPanel } from "./cloud-sync-panel"
import { clearCourses, deleteCourse, listCourses, replaceCourses, saveCourse } from "@/lib/supabase/courses"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

const STORAGE_KEY = "student-dashboard-courses"
const CURRENT_SEMESTER_KEY = "student-dashboard-current-semester"
const DEFAULT_CURRENT_SEMESTER = "2026S"
const CLOUD_SYNC_ENABLED = isSupabaseConfigured()

export function Dashboard() {
  const [courseList, setCourseList] = useState<Course[]>(CLOUD_SYNC_ENABLED ? [] : initialCourses)
  const [hasLoadedCourses, setHasLoadedCourses] = useState(!CLOUD_SYNC_ENABLED)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [currentSemester, setCurrentSemester] = useState(DEFAULT_CURRENT_SEMESTER)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!CLOUD_SYNC_ENABLED)
  const [isSyncing, setIsSyncing] = useState(false)
  const isMobile = useIsMobile()

  const supabase = useMemo(() => {
    if (!CLOUD_SYNC_ENABLED) {
      return null
    }

    return getSupabaseBrowserClient()
  }, [])

  useEffect(() => {
    const storedCurrentSemester = window.localStorage.getItem(CURRENT_SEMESTER_KEY)
    if (storedCurrentSemester) {
      setCurrentSemester(storedCurrentSemester)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(CURRENT_SEMESTER_KEY, currentSemester)
  }, [currentSemester])

  useEffect(() => {
    if (CLOUD_SYNC_ENABLED) {
      return
    }

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
      setHasLoadedCourses(true)
    }
  }, [])

  useEffect(() => {
    if (CLOUD_SYNC_ENABLED || !hasLoadedCourses) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courseList))
  }, [courseList, hasLoadedCourses])

  useEffect(() => {
    if (!supabase) {
      return
    }

    let isActive = true

    const handleSession = async (nextSession: Session | null) => {
      if (!isActive) {
        return
      }

      setSession(nextSession)

      if (!nextSession) {
        setCourseList([])
        setHasLoadedCourses(true)
        setAuthReady(true)
        return
      }

      setAuthReady(true)
      setHasLoadedCourses(false)
      setIsSyncing(true)

      try {
        const remoteCourses = await listCourses(supabase)

        if (!isActive) {
          return
        }

        setCourseList(remoteCourses)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load courses from Supabase."
        toast({
          title: "Cloud sync failed",
          description: message,
          variant: "destructive",
        })
      } finally {
        if (isActive) {
          setHasLoadedCourses(true)
          setIsSyncing(false)
        }
      }
    }

    void supabase.auth.getSession()
      .then(({ data }) => {
        void handleSession(data.session)
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Could not restore the Supabase session."
        toast({
          title: "Cloud sync failed",
          description: message,
          variant: "destructive",
        })
        setAuthReady(true)
        setHasLoadedCourses(true)
        setIsSyncing(false)
      })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void handleSession(nextSession)
    })

    return () => {
      isActive = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

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
  const gradeDistribution = useMemo(() => getGradeDistribution(courseList), [courseList])

  const openAddDialog = () => {
    setEditingCourse(null)
    setIsDialogOpen(true)
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setIsDialogOpen(true)
  }

  const handleDeleteCourse = (courseId: string) => {
    void (async () => {
      const courseToDelete = courseList.find((course) => course.id === courseId)
      if (!courseToDelete) {
        return
      }

      const confirmed = window.confirm(`Delete "${courseToDelete.name}" from the dashboard?`)
      if (!confirmed) {
        return
      }

      if (!supabase || !session) {
        setCourseList((current) => current.filter((course) => course.id !== courseId))
        return
      }

      setIsSyncing(true)

      try {
        await deleteCourse(supabase, courseId)
        setCourseList((current) => current.filter((course) => course.id !== courseId))
      } catch (error) {
        const message = error instanceof Error ? error.message : "The course could not be deleted."
        toast({
          title: "Delete failed",
          description: message,
          variant: "destructive",
        })
      } finally {
        setIsSyncing(false)
      }
    })()
  }

  const handleSaveCourse = (values: CourseFormValues, courseId?: string) => {
    void (async () => {
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

      if (!supabase || !session) {
        setCourseList((current) => {
          if (!courseId) {
            return [...current, nextCourse]
          }

          return current.map((course) => (course.id === courseId ? nextCourse : course))
        })

        setIsDialogOpen(false)
        setEditingCourse(null)
        return
      }

      setIsSyncing(true)

      try {
        const savedCourse = await saveCourse(supabase, session.user.id, nextCourse)

        setCourseList((current) => {
          if (!courseId) {
            return [...current, savedCourse]
          }

          return current.map((course) => (course.id === courseId ? savedCourse : course))
        })

        setIsDialogOpen(false)
        setEditingCourse(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : "The course could not be saved."
        toast({
          title: "Save failed",
          description: message,
          variant: "destructive",
        })
      } finally {
        setIsSyncing(false)
      }
    })()
  }

  const handleImportComplete = ({ courses, skippedRows, fileName }: CourseImportResult) => {
    void (async () => {
      if (supabase && session) {
        setIsSyncing(true)

        try {
          await replaceCourses(supabase, session.user.id, courses)
        } catch (error) {
          const message = error instanceof Error ? error.message : "The imported courses could not be saved."
          toast({
            title: "Import failed",
            description: message,
            variant: "destructive",
          })
          setIsSyncing(false)
          return
        }

        setIsSyncing(false)
      }

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
    })()
  }

  const handleImportError = (message: string) => {
    toast({
      title: "Import failed",
      description: message,
      variant: "destructive",
    })
  }

  const handleClearAllCourses = () => {
    void (async () => {
      if (supabase && session) {
        setIsSyncing(true)

        try {
          await clearCourses(supabase)
        } catch (error) {
          const message = error instanceof Error ? error.message : "The dashboard could not be cleared."
          toast({
            title: "Clear failed",
            description: message,
            variant: "destructive",
          })
          setIsSyncing(false)
          return
        }

        setIsSyncing(false)
      }

      setCourseList([])
      setSelectedSemester("all")
      setSelectedStatus("all")
      setSearchQuery("")
      setCurrentSemester("all")

      toast({
        title: "Table cleared",
        description: "All courses were removed from the dashboard.",
      })
    })()
  }

  const handleSignIn = async (email: string) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.")
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
    })

    if (error) {
      throw error
    }

    toast({
      title: "Check your inbox",
      description: `A sign-in code was sent to ${email}.`,
    })
  }

  const handleVerifyCode = async (email: string, code: string) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.")
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    })

    if (error) {
      throw error
    }

    toast({
      title: "Signed in",
      description: `Cloud sync is now connected for ${email}.`,
    })
  }

  const handleSignOut = async () => {
    if (!supabase) {
      return
    }

    setIsSyncing(true)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      toast({
        title: "Signed out",
        description: "Cloud sync has been disconnected for this browser.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign out."
      toast({
        title: "Sign-out failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const showCloudGate = CLOUD_SYNC_ENABLED && authReady && !session
  const showLoadingState = CLOUD_SYNC_ENABLED && (!authReady || !hasLoadedCourses)
  const effectiveViewMode = isMobile ? "cards" : "table"

  if (showLoadingState) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/20 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Cloud className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Cloud Sync</p>
                  <p className="text-xs text-muted-foreground">Restoring your dashboard</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-7">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                <p className="text-sm font-medium text-foreground">Connecting securely</p>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 rounded-full bg-emerald-500/80" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Loading your session and course data.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (showCloudGate) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border/70 bg-background/80">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
              <GraduationCap className="h-5 w-5 text-background" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Uni Dashboard</h1>
              <p className="text-xs text-muted-foreground">Simple Course Tracking</p>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full">
            <CloudSyncPanel
              cloudSyncEnabled={CLOUD_SYNC_ENABLED}
              isLoading={isSyncing}
              userEmail={null}
              onSignIn={handleSignIn}
              onVerifyCode={handleVerifyCode}
              onSignOut={handleSignOut}
            />
          </div>
        </main>

        <footer className="border-t border-border/70 bg-background/80">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
            <p>{new Date().getFullYear()} Uni Dashboard</p>
            <a
              href="https://github.com/bendemaj/student-dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              <span>Repository</span>
            </a>
          </div>
        </footer>
      </div>
    )
  }

  const currentUserEmail = session?.user.email ?? null

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
                <h1 className="text-lg font-semibold text-foreground">Uni Dashboard</h1>
                <p className="text-xs text-muted-foreground">Simple Course Tracking</p>
              </div>
            </div>
            {currentUserEmail && (
              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 sm:gap-3 sm:px-3">
                <div className="hidden items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:flex">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Sync active</span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <span className="max-w-[150px] truncate text-xs text-muted-foreground sm:max-w-[220px]">
                  {currentUserEmail}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void handleSignOut()}
                  disabled={isSyncing}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {!currentUserEmail && (
            <CloudSyncPanel
              cloudSyncEnabled={CLOUD_SYNC_ENABLED}
              isLoading={isSyncing}
              userEmail={currentUserEmail}
              onSignIn={handleSignIn}
              onVerifyCode={handleVerifyCode}
              onSignOut={handleSignOut}
            />
          )}

          {/* Stats Cards */}
          <StatsCards stats={allStats} />

          {/* Combined Progress Overview */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SemesterOverview
                courses={courseList}
                semesters={semesters}
                currentSemester={currentSemester}
                onCurrentSemesterChange={setCurrentSemester}
              />
            </div>
            <div className="lg:col-span-2">
              <GradeDistribution data={gradeDistribution} />
            </div>
          </div>

          <ExamCalendar courses={courseList} />

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

            {effectiveViewMode === "table" ? (
              <CourseTable
                courses={filteredCourses}
                totalCoursesCount={courseList.length}
                onEditCourse={handleEditCourse}
                onSaveCourse={handleSaveCourse}
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

      <footer className="border-t border-border/70 bg-background/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-muted-foreground sm:px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p className="font-medium text-foreground/85">
            {new Date().getFullYear()} Uni Dashboard - Built with <a 
              href="https://nextjs.org"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Next.js
            </a>
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/bendemaj/student-dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              <span>Repository</span>
            </a>
          </div>
        </div>
      </footer>

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
