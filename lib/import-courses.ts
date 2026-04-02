import * as XLSX from "xlsx"
import { Course, GRADE_OPTIONS } from "./types"

const HEADER_ALIASES = {
  name: ["name", "course", "coursename", "title", "module", "class", "subject", "titel", "Titel"],
  credits: ["credits", "credit", "ects", "points", "cp", "ECTS"],
  semester: ["semester", "term", "studyterm"],
  status: ["status", "state", "completionstatus", "completed"],
  grade: ["grade", "note", "result", "mark", "score", "Note"],
  courseType: ["typ", "type", "coursetype", "lvatyp"],
  courseNumber: ["lvanummer", "lvanr", "lvanummer", "coursenumber", "coursecode", "number"],
  examDate: [
    "examdate",
    "dateofexam",
    "date",
    "assessmentdate",
    "examday",
    "prufungsdatum",
    "pruefungsdatum",
    "examdatum",
  ],
  examiner: [
    "examiner",
    "teacher",
    "instructor",
    "lecturer",
    "professor",
    "prufer",
    "pruefer",
    "lehrende",
    "lehrender",
    "dozent",
    "pruferin",
    "prueferin",
  ],
} as const

const NUMERIC_GRADE_MAP: Record<string, string> = {
  "1": "sehr gut",
  "2": "gut",
  "3": "befriedigend",
  "4": "genügend",
}

const DONE_STATUSES = new Set(["done", "completed", "complete", "passed", "finished", "yes", "true", "1"])
const PENDING_STATUSES = new Set(["pending", "open", "planned", "todo", "no", "false", "0"])

type RawRow = Record<string, unknown>

export interface CourseImportResult {
  courses: Course[]
  skippedRows: number
  fileName: string
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

function normalizeText(value: unknown) {
  if (value == null) {
    return ""
  }

  return String(value).trim()
}

function findCellValue(row: RawRow, aliases: readonly string[]) {
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeHeader(key)
    if (aliases.includes(normalizedKey) || aliases.some((alias) => normalizedKey.includes(alias))) {
      return value
    }
  }

  return undefined
}

function normalizeCredits(value: unknown) {
  const text = normalizeText(value).replace(",", ".")
  const parsed = Number(text)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function formatCourseNumber(value: unknown) {
  const text = normalizeText(value).replace(/\D/g, "")
  if (text.length === 6) {
    return `${text.slice(0, 3)}.${text.slice(3)}`
  }

  return normalizeText(value)
}

function normalizeSemester(value: unknown) {
  const text = normalizeText(value).toUpperCase().replace(/\s+/g, "")
  if (!text) {
    return null
  }

  const match = text.match(/(20\d{2}).*?(S|W|SS|WS|SUMMER|SPRING|WINTER|FALL|AUTUMN)/)
  if (match) {
    const year = match[1]
    const termToken = match[2]
    const term = ["S", "SS", "SUMMER", "SPRING"].includes(termToken) ? "S" : "W"
    return `${year}${term}`
  }

  return text
}

function inferSemesterFromDateString(value: string) {
  const match = value.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/)
  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  if (month >= 4 && month <= 9) {
    return `${year}S`
  }

  if (month >= 10 && month <= 12) {
    return `${year}W`
  }

  return `${year - 1}W`
}

function normalizeGrade(value: unknown) {
  const text = normalizeText(value).toLowerCase()
  if (!text) {
    return null
  }

  if (NUMERIC_GRADE_MAP[text]) {
    return NUMERIC_GRADE_MAP[text]
  }

  const matchedOption = GRADE_OPTIONS.find((grade) => grade.toLowerCase() === text)
  return matchedOption ?? text
}

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

function normalizeExamDate(value: unknown) {
  if (value == null || value === "") {
    return null
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate(value)
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      const date = new Date(parsed.y, parsed.m - 1, parsed.d)
      if (!Number.isNaN(date.getTime())) {
        return formatDate(date)
      }
    }
  }

  const text = normalizeText(value)
  return text || null
}

function buildCourseName(row: RawRow) {
  const title = normalizeText(findCellValue(row, HEADER_ALIASES.name))
  const type = normalizeText(findCellValue(row, HEADER_ALIASES.courseType)).toUpperCase()
  const courseNumber = formatCourseNumber(findCellValue(row, HEADER_ALIASES.courseNumber))

  if (!title) {
    return ""
  }

  const prefix = [courseNumber, type].filter(Boolean).join(" ")
  return prefix ? `${prefix} ${title}` : title
}

function normalizeStatus(value: unknown, grade: string | null, examDate: string | null): Course["status"] {
  const text = normalizeText(value).toLowerCase()
  if (DONE_STATUSES.has(text)) {
    return "done"
  }

  if (PENDING_STATUSES.has(text)) {
    return "pending"
  }

  return grade || examDate ? "done" : "pending"
}

function isBlankRow(row: RawRow) {
  return Object.values(row).every((value) => !normalizeText(value))
}

function normalizeRow(row: RawRow) {
  if (isBlankRow(row)) {
    return null
  }

  const name = buildCourseName(row)
  const credits = normalizeCredits(findCellValue(row, HEADER_ALIASES.credits))
  const grade = normalizeGrade(findCellValue(row, HEADER_ALIASES.grade))
  const examDate = normalizeExamDate(findCellValue(row, HEADER_ALIASES.examDate))
  const examiner = normalizeText(findCellValue(row, HEADER_ALIASES.examiner)) || null
  const semester =
    normalizeSemester(findCellValue(row, HEADER_ALIASES.semester)) ??
    (examDate ? inferSemesterFromDateString(examDate) : null)
  const status = normalizeStatus(findCellValue(row, HEADER_ALIASES.status), grade, examDate)

  if (!name || credits == null || !semester) {
    return null
  }

  return {
    id: crypto.randomUUID(),
    name,
    credits,
    semester,
    status,
    grade: status === "done" ? grade : null,
    examDate,
    examiner,
  } satisfies Course
}

function readWorkbook(file: File) {
  return file.arrayBuffer().then((buffer) =>
    XLSX.read(buffer, {
      type: "array",
      cellDates: true,
    }),
  )
}

function findHeaderRowIndex(rows: unknown[][]) {
  const requiredHeaders = [
    ...HEADER_ALIASES.name,
    ...HEADER_ALIASES.credits,
    ...HEADER_ALIASES.grade,
    ...HEADER_ALIASES.examDate,
  ]

  return rows.findIndex((row) => {
    const normalizedRow = row.map((cell) => normalizeHeader(normalizeText(cell)))
    const matchCount = requiredHeaders.filter((alias) => normalizedRow.includes(alias)).length
    return matchCount >= 3
  })
}

export async function importCoursesFromFile(file: File): Promise<CourseImportResult> {
  const workbook = await readWorkbook(file)
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]

  if (!sheet) {
    throw new Error("The file does not contain a readable worksheet.")
  }

  const previewRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: "",
  })
  const headerRowIndex = findHeaderRowIndex(previewRows)

  if (headerRowIndex < 0) {
    throw new Error("No supported header row was found in the spreadsheet.")
  }

  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: "",
    raw: true,
    range: headerRowIndex,
  })

  const normalized = rows.map(normalizeRow)
  const courses = normalized.filter((course): course is Course => course !== null)

  if (courses.length === 0) {
    throw new Error("No valid course rows were found. Required columns: name, credits, semester.")
  }

  return {
    courses,
    skippedRows: rows.length - courses.length,
    fileName: file.name,
  }
}
