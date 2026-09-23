import catalog from '../content/exercise-videos.json'
import type { Exercise } from './domain'
export interface ExerciseVideo {
  id: string
  exerciseId: string
  name: string
  licenseUrl: string
  creator: string
  source: { apiRecordUrl: string; exerciseId: number }
  video: { path: string }
  poster: { path: string }
}
export const exerciseVideos = catalog.items as ExerciseVideo[]
const byId = new Map(exerciseVideos.map((item) => [item.id, item]))
const byExercise = new Map(exerciseVideos.map((item) => [item.exerciseId, item]))
export function videoForExercise(e?: Omit<Exercise, 'kind'> & { kind?: string }) {
  if (!e || e.media_url) return undefined
  return e.media_ref
    ? byId.get(e.media_ref)
    : !e.owner_id && !e.workspace_id
      ? byExercise.get(e.id)
      : undefined
}
const api = import.meta.env.VITE_API_URL || 'http://127.0.0.1:55331'
export const exerciseAssetUrl = (path: string) => api + path
