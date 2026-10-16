import type { Database } from '@rafik/shared/database.types'
import type { Resource } from '../resources/files'
type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Team = Row<'teams'>
export type Enrollment = Row<'team_clients'> & {
  name: string
  coach_name: string
  pending_name: string
  team_name: string
}
export type Workspace = {
  team: Team & { role: 'owner' | 'admin' | 'coach' }
  members: (Row<'team_members'> & { name: string })[]
  invitations: Omit<Row<'team_invitations'>, 'token_hash'>[]
  clients: Enrollment[]
  groups: Row<'team_groups'>[]
  group_members: Row<'team_group_members'>[]
  plans: Omit<Row<'team_plans'>, 'prescription'>[]
  resources: Resource[]
  activity: Row<'team_activity'>[]
}
