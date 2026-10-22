import { institutionContext } from '../../app/institution'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { request, rpc, rows } from '../../lib/backend'
import { user, contexts } from '../../app/auth'
import type { Exercise, Plan, PlanVersion } from '../../lib/domain'
export function programContext(route: RouteLocationNormalizedLoaded) {
  const workspace = institutionContext().workspace
  const view = institutionContext().view
  const base = ''
  const endpoint = `/v1/workspaces/${workspace}`
  const key = workspace ? `${workspace}:${view}` : 'independent'
  const self = () =>
    contexts.value.find((c) => c.workspace_id === workspace && c.role === view)?.member_id
  return {
    workspace,
    view,
    base,
    key,
    catalog: () =>
      workspace
        ? request<Exercise[]>(`${endpoint}/catalog?view=${view}`)
        : rows<Exercise>('exercises'),
    load: async (id: string) => {
      if (workspace)
        return request<{
          program: Plan
          editable: boolean
          versions: PlanVersion[]
          catalog: Exercise[]
        }>(`${endpoint}/programs?view=${view}&program=${id}`)
      return {
        program: (await rows<Plan>('plans', 'id', id))[0]!,
        editable: true,
        versions: [] as PlanVersion[],
        catalog: await rows<Exercise>('exercises'),
      }
    },
    command: async (action: 'save' | 'publish', args: Record<string, unknown>) => {
      if (workspace)
        return request<{ plan: Plan; version?: PlanVersion }>(`${endpoint}/programs`, {
          method: 'POST',
          body: JSON.stringify({ ...args, action, view }),
        })
      const plan = await rpc<Plan>('save_plan', {
        p_id: args.id,
        p_title: args.title,
        p_draft: args.draft,
        p_expected_version: args.revision,
      })
      const version =
        action === 'publish'
          ? await rpc<PlanVersion>('publish_plan', {
              p_id: plan.id,
              p_expected_version: plan.draft_version,
            })
          : undefined
      return { plan, version }
    },
    editableExercise: (e: Exercise) =>
      workspace
        ? !!e.workspace_id &&
          ((view === 'admin' && e.scope !== 'private') || e.created_by === self())
        : e.owner_id === user.value?.id,
    exercise: (
      id: string,
      data: Record<string, unknown>,
      revision: number,
      operation: string = crypto.randomUUID(),
    ) =>
      workspace
        ? request(`${endpoint}/catalog`, {
            method: 'POST',
            body: JSON.stringify({
              operation,
              view,
              action: 'exercise',
              id,
              data,
              revision,
            }),
          })
        : rpc('save_exercise', { p_id: id, p_data: data, p_revision: revision }),
    exerciseActive: (e: Exercise, operation: string = crypto.randomUUID()) =>
      workspace
        ? request(`${endpoint}/catalog`, {
            method: 'POST',
            body: JSON.stringify({
              operation,
              view,
              action: 'exercise-active',
              id: e.id,
              revision: e.revision,
              active: e.active === false,
            }),
          })
        : rpc('set_exercise_active', { p_id: e.id, p_active: e.active === false }),
  }
}
