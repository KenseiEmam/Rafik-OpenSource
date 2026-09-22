import type { Database } from '../../lib/database.types'
export interface Field {
  id: string
  label: string
  type: 'text' | 'number' | 'boolean'
  required: boolean
  unit?: string
  min?: number
  max?: number
}
export interface CoachingForm {
  id: string
  coach_id: string
  title: string
  kind: 'checkin' | 'assessment'
  fields: Field[]
  revision: number
}
export interface CoachingRequest {
  id: string
  series_id: string
  relationship_id: string
  form_id: string | null
  form_revision: number
  title: string
  kind: 'checkin' | 'assessment'
  fields: Field[]
  due_date: string
  answers: Record<string, string | number | boolean | null>
  revision: number
  submitted_at: string | null
  reviewed_at: string | null
  feedback: string
  cancelled: boolean
  updated_at: string
}
export type Measurement = Database['public']['Tables']['measurements']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export interface Conversation {
  id: string
  name: string
  coach_id: string
  client_id: string
  state: string
  unread: number
  latest: string | null
  updated_at: string | null
}
export interface ProgressSet {
  reps: number
  load: number
  unit: string
  seconds: number | null
  metres: number | null
  effort: number | null
}
export interface ProgressSession {
  id: string
  date: string
  title: string
  exercises: { id: string; name: string; name_ar: string; kind: string; sets: ProgressSet[] }[]
}
