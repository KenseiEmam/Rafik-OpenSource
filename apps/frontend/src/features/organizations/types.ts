export type Role = 'admin' | 'trainer' | 'trainee'
export type Context = {
  member_id?: string
  id: string
  workspace_id?: string
  kind: 'personal' | 'independent' | 'organization'
  name: string
  role: Role
  path: string
}
export type Member = {
  id: string
  user_id: string | null
  name: string
  email?: string
  roles: Role[]
  active: boolean
  revision: number
  trainer_id: string | null
}
export type Organization = {
  invitationsNext: number | null
  eventsNext: number | null
  summary: { trainees: number; trainers: number; unassigned: number }
  workspace: { id: string; name: string; revision: number }
  self: { id: string; roles: Role[] }
  members: Member[]
  names: { id: string; name: string }[]
  invitations: { id: string; email: string; roles: Role[]; expires_at: string }[]
  events: { id: string; kind: string; created_at: string; subject_id: string | null }[]
}
