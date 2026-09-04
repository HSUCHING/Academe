type AccountProfile = Record<string, unknown> & { email?: string | null }
type SessionUser = { email?: string | null } | null | undefined

export function resolveAccountProfile<T extends AccountProfile>(
  publicProfile: T,
  sessionUser: SessionUser
): T & { email: string } {
  return {
    ...publicProfile,
    email: sessionUser?.email ?? publicProfile.email ?? '',
  }
}

export function hasAccountEmailChanged(email: string, originalEmail: string) {
  return email !== originalEmail
}
