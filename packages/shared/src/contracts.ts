export type ApiUser = {
  id: string
  email: string | null
  user_metadata: Record<string, unknown>
}

export type ApiErrorBody = { message: string }

/** Minimal calendar projection retained by the Android attendance client. */
export type FieldAttendance = 'unmarked' | 'present' | 'absent' | 'excused'
export type FieldEvent = {
  id: string
  title: string
  kind: 'training' | 'assessment'
  starts_at: string
  ends_at: string
  timezone: string
  location: string
  state: 'scheduled' | 'cancelled' | 'completed'
  revision: number
}
export type FieldPerson = {
  member_id: string
  name: string
  duty: 'staff' | 'trainee'
  attendance: FieldAttendance
  revision: number
  active: boolean
}
export type FieldDrill = {
  key: string
  name: string
  kind: 'number' | 'text'
  unit: string
  min?: number
  max?: number
}
export type FieldResult = {
  event_id: string
  member_id: string
  values: Record<string, string | number>
  note: string
  revision: number
  recorded_at: string
  recorded_by: string
}
export type FieldRoster = {
  event: FieldEvent
  people: FieldPerson[]
  /** Absent on older attendance-only device packages; refresh online before scoring. */
  definition?: FieldDrill[]
  results?: FieldResult[]
}
export type FieldAttendanceCommand = {
  action: 'attendance'
  view: 'trainer'
  id: string
  member: string
  attendance: FieldAttendance
  revision: number
  operation: string
}
export type FieldResultCommand = {
  action: 'result'
  view: 'trainer'
  id: string
  member: string
  values: Record<string, string | number>
  note: string
  revision: number
  operation: string
}
export type FieldFinishCommand = {
  action: 'finish'
  view: 'trainer'
  id: string
  member?: never
  revision: number
  operation: string
}
export type FieldCommand = FieldAttendanceCommand | FieldResultCommand | FieldFinishCommand

export type AthletePlanStatus = 'active' | 'upcoming' | 'expired' | 'ended'
export type AthletePlanSummary = {
  id: string
  member_id: string
  member_name: string
  member_active: boolean
  start_date: string
  end_date: string | null
  state: string
  status: AthletePlanStatus
  schedule_mode: string
  version: {
    id: string
    title: string
    revision: number
    program_id: string
    prescription?: unknown
  }
}
export type AthletePlanPage = {
  items: AthletePlanSummary[]
  total: number
  next: number | null
  today: string
  zone: string
}

/** Online-only participant history; never part of the offline event package. */
export type FieldHistoryEntry = {
  id: string
  member_id: string
  recorded_at: string
  recorded_by: string | null
  recorded_name: string | null
} & (
  | { kind: 'attendance'; previous_attendance: FieldAttendance; attendance: FieldAttendance }
  | { kind: 'results'; revision: number; values: Record<string, string | number>; note: string }
)
export type FieldHistoryPage = { items: FieldHistoryEntry[]; next: number | null }
