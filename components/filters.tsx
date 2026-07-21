"use client"

import { Filter, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedSemester: string
  setSelectedSemester: (semester: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  semesters: string[]
  visibleCoursesCount: number
  totalCoursesCount: number
  onAddCourse: () => void
}

export function Filters({
  searchQuery,
  setSearchQuery,
  selectedSemester,
  setSelectedSemester,
  selectedStatus,
  setSelectedStatus,
  semesters,
  visibleCoursesCount,
  totalCoursesCount,
  onAddCourse,
}: FiltersProps) {
  const hasFilters = searchQuery || selectedSemester !== "all" || selectedStatus !== "all"

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedSemester("all")
    setSelectedStatus("all")
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">All Courses</h2>
          <p className="text-xs text-muted-foreground">
            Showing {visibleCoursesCount} of {totalCoursesCount} courses
          </p>
        </div>
        <Button onClick={onAddCourse} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      <div className="grid gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="bg-background pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="hidden h-9 items-center justify-center rounded-md border border-border bg-muted/30 px-2 text-muted-foreground sm:flex">
            <Filter className="h-4 w-4" />
          </div>

          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-full bg-background sm:w-[164px]">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester} value={semester}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full bg-background sm:w-[144px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="done">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
