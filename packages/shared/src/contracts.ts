export type ApiUser = {
  id: string
  email: string | null
  user_metadata: Record<string, unknown>
}

export type ApiErrorBody = { message: string }
