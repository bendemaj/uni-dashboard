import { Course, Stats, GRADE_MAP } from "./types"

export interface GradeDistributionEntry {
  key: string
  grade: string
  label: string
  count: number
}

const GRADE_DISTRIBUTION_ORDER: { key: string; grade: string; label: string }[] = [
  { key: "sehrGut", grade: "sehr gut", label: "Sehr gut" },
  { key: "gut", grade: "gut", label: "Gut" },
  { key: "befriedigend", grade: "befriedigend", label: "Befriedigend" },
  { key: "genuegend", grade: "genügend", label: "Genügend" },
  { key: "ohneNote", grade: "mit Erfolg teilgenommen", label: "Mit Erfolg" },
]

export const courses: Course[] = [
  { id: "1", name: "101.679 VO Mathematik 1 für ET", credits: 6.0, semester: "2024W", status: "done", grade: "gut", examDate: "15.05.2025", examiner: "Peter Szmolyan" },
  { id: "2", name: "360.058 VU Einführung in das wissenschaftliche Programmieren", credits: 5.0, semester: "2024W", status: "done", grade: "sehr gut", examDate: "16.01.2025", examiner: "Hajdin Ceric" },
  { id: "3", name: "363.014 VO Elektrotechnik 1", credits: 5.0, semester: "2024W", status: "done", grade: "gut", examDate: "03.03.2025", examiner: "Günther Michael Zeck" },
  { id: "4", name: "363.015 UE Elektrotechnik 1", credits: 4.0, semester: "2024W", status: "done", grade: "befriedigend", examDate: "30.01.2025", examiner: "Edin Mulasalihovic" },
  { id: "5", name: "101.680 UE Mathematik 1 für ET", credits: 3.0, semester: "2024W", status: "done", grade: "sehr gut", examDate: "23.01.2025", examiner: "Peter Szmolyan" },
  { id: "6", name: "101.A26 VU Angleichungskurs Mathematik", credits: 3.0, semester: "2024W", status: "done", grade: "mit Erfolg teilgenommen", examDate: "30.09.2024", examiner: "Andreas Körner" },
  { id: "7", name: "384.193 VO Digitale Systeme", credits: 2.5, semester: "2024W", status: "done", grade: "gut", examDate: "27.03.2025", examiner: "Friedrich Bauer" },
  { id: "8", name: "384.194 UE Digitale Systeme", credits: 1.5, semester: "2024W", status: "done", grade: "befriedigend", examDate: "24.01.2025", examiner: "Friedrich Bauer" },
  { id: "9", name: "350.002 VU Orientierung ETIT", credits: 1.0, semester: "2024W", status: "done", grade: "mit Erfolg teilgenommen", examDate: "23.10.2024", examiner: "Silvan Schmid" },
  { id: "10", name: "360.062 VU Systemnahes Programmieren", credits: 7.0, semester: "2025S", status: "done", grade: "sehr gut", examDate: "27.06.2025", examiner: "Hajdin Ceric" },
  { id: "11", name: "101.682 VO Mathematik 2 für ET", credits: 6.0, semester: "2025S", status: "done", grade: "genügend", examDate: "26.06.2025", examiner: "Elisa Davoli" },
  { id: "12", name: "350.006 PR Wahlpraktikum", credits: 6.0, semester: "2025S", status: "done", grade: "mit Erfolg teilgenommen", examDate: "11.09.2025", examiner: "Silvan Schmid" },
  { id: "13", name: "101.683 UE Mathematik 2 für ET", credits: 3.0, semester: "2025S", status: "done", grade: "gut", examDate: "30.06.2025", examiner: "Peter Szmolyan" },
  { id: "14", name: "366.109 VO Materialien der Elektrotechnik", credits: 3.0, semester: "2025S", status: "done", grade: "sehr gut", examDate: "14.07.2025", examiner: "Franz Keplinger" },
  { id: "15", name: "384.141 VU Fachvertiefung - Softwareentwicklung", credits: 5.0, semester: "2025W", status: "done", grade: "sehr gut", examDate: "16.12.2025", examiner: "Benedikt Herold" },
  { id: "16", name: "362.129 VU Halbleiterphysik", credits: 4.5, semester: "2025W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "17", name: "387.098 VU Zeitkontinuierliche Signale und Systeme", credits: 4.5, semester: "2025W", status: "done", grade: "befriedigend", examDate: "19.03.2026", examiner: "Thomas Müller" },
  { id: "18", name: "101.685 VO Mathematik 3 für ET", credits: 4.0, semester: "2025W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "19", name: "369.010 VO Messtechnik", credits: 4.0, semester: "2025W", status: "done", grade: "befriedigend", examDate: "09.01.2026", examiner: "Ernst Karl Csencsics" },
  { id: "20", name: "384.173 VU Mikrocomputer", credits: 4.0, semester: "2025W", status: "done", grade: "sehr gut", examDate: "26.01.2026", examiner: "Sofia Maragkou" },
  { id: "21", name: "351.018 VO Technik und Gesellschaft", credits: 3.0, semester: "2025W", status: "done", grade: "sehr gut", examDate: "20.02.2026", examiner: "Daniela Fuchs" },
  { id: "22", name: "101.686 UE Mathematik 3 für ET", credits: 2.0, semester: "2025W", status: "done", grade: "gut", examDate: "19.01.2026", examiner: "Peter Szmolyan" },
  { id: "23", name: "366.111 UE Kommunikation und Präsentation", credits: 1.5, semester: "2025W", status: "done", grade: "sehr gut", examDate: "13.02.2026", examiner: "Thomas Wulz" },
  { id: "24", name: "366.110 LU Materialien der Elektrotechnik", credits: 1.0, semester: "2025W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "25", name: "363.016 VO Elektrotechnik 2", credits: 5.0, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "26", name: "384.139 VU Fachvertiefung - Computersysteme", credits: 5.0, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "27", name: "362.072 VU Elektronische Bauelemente", credits: 4.0, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "28", name: "363.017 UE Elektrotechnik 2", credits: 4.0, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "29", name: "369.012 VU Schaltungstechnik", credits: 4.0, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "30", name: "376.104 VO Modellbildung", credits: 4.0, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "31", name: "389.055 VU Zeitdiskrete Signale und Systeme", credits: 4.0, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "32", name: "366.007 VO Bluetooth & Co.", credits: 2.3, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "33", name: "362.128 LU Labor für Halbleiterelektronik", credits: 2.0, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "34", name: "384.996 LU Mikrocomputer Labor", credits: 2.0, semester: "2026S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "35", name: "376.103 VO Automatisierung", credits: 5.0, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "36", name: "389.232 VU Wellenausbreitung", credits: 5.0, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "37", name: "387.096 VO Photonik", credits: 3.5, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "38", name: "064.041 VU Grundlagen wissenschaftlichen Arbeitens", credits: 3.0, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "39", name: "280.816 VO Grundlagen der Betriebswirtschaftslehre und des Managements", credits: 3.0, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "40", name: "366.071 VO Sensorik und Sensorsysteme", credits: 3.0, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "41", name: "369.011 LU Messtechnik Labor", credits: 3.0, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "42", name: "370.015 VU Maschinen und Antriebe", credits: 3.0, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "43", name: "370.103 VO Elektrische Energiesysteme", credits: 3.0, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "44", name: "383.024 VO Akustische Oberflächenwellenbauelemente und -Sensoren", credits: 2.3, semester: "2026W", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "45", name: "362.133 PR Bachelorarbeit mit Seminar", credits: 10.0, semester: "2027S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "46", name: "360.051 VU Elektrodynamik", credits: 8.0, semester: "2027S", status: "pending", grade: null, examDate: null, examiner: null },
  { id: "47", name: "389.231 VU Telekommunikation", credits: 4.0, semester: "2027S", status: "pending", grade: null, examDate: null, examiner: null },
]

export function getStats(filteredCourses: Course[]): Stats {
  const completedCourses = filteredCourses.filter((c) => c.status === "done")
  const pendingCourses = filteredCourses.filter((c) => c.status === "pending")

  const completedCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0)
  const pendingCredits = pendingCourses.reduce((sum, c) => sum + c.credits, 0)
  const totalCredits = completedCredits + pendingCredits

  // Calculate weighted average grade (only for graded courses)
  const gradedCourses = completedCourses.filter((c) => c.grade && GRADE_MAP[c.grade])
  let averageGrade: number | null = null

  if (gradedCourses.length > 0) {
    const totalWeightedGrade = gradedCourses.reduce(
      (sum, c) => sum + GRADE_MAP[c.grade!] * c.credits,
      0
    )
    const totalGradedCredits = gradedCourses.reduce((sum, c) => sum + c.credits, 0)
    averageGrade = totalWeightedGrade / totalGradedCredits
  }

  return {
    totalCredits,
    completedCredits,
    pendingCredits,
    completedCourses: completedCourses.length,
    pendingCourses: pendingCourses.length,
    averageGrade,
  }
}

export function getGradeDistribution(courseList: Course[]): GradeDistributionEntry[] {
  return GRADE_DISTRIBUTION_ORDER.map(({ key, grade, label }) => ({
    key,
    grade,
    label,
    count: courseList.filter((c) => c.grade === grade).length,
  }))
}

export function getSemesters(courseList: Course[]): string[] {
  const semesters = [...new Set(courseList.map((c) => c.semester))]
  return semesters.sort((a, b) => {
    const [yearA, termA] = [parseInt(a.slice(0, 4)), a.slice(4)]
    const [yearB, termB] = [parseInt(b.slice(0, 4)), b.slice(4)]
    if (yearA !== yearB) return yearA - yearB
    return termA === "S" ? -1 : 1
  })
}
