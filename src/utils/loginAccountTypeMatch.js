function normalizeRoleToken(r) {
  return String(r || '').toUpperCase().replace(/\s+/g, '_')
}

/** All role strings from API `user` (roles array + single role field). */
export function collectApiRoles(user) {
  const set = new Set()
  if (Array.isArray(user?.roles)) {
    user.roles.forEach((r) => set.add(normalizeRoleToken(r)))
  }
  if (user?.role != null && user.role !== '') {
    set.add(normalizeRoleToken(user.role))
  }
  return set
}

/**
 * True if the dropdown selection matches the account returned by the API.
 * Prevents e.g. Lab technician + doctor credentials from completing login.
 */
export function loginKindMatchesApiUser(loginKind, user) {
  const roles = collectApiRoles(user)
  switch (loginKind) {
    case 'super_admin':
      return roles.has('SUPER_ADMIN')
    case 'hospital_admin':
      return roles.has('ADMIN') || roles.has('HOSPITAL_ADMIN') || roles.has('HOSPITALADMIN')
    case 'DOCTOR':
      return roles.has('DOCTOR')
    case 'PHARMACIST':
      return roles.has('PHARMACIST')
    case 'LAB_TECH':
      return roles.has('LAB_TECH')
    case 'NURSE':
      return roles.has('NURSE')
    case 'RECEPTIONIST':
      return roles.has('RECEPTIONIST')
    case 'TELEMEDICINE':
      return roles.has('TELEMEDICINE')
    default:
      return false
  }
}

export const LOGIN_KIND_MISMATCH_MESSAGE =
  'The account type you selected does not match this account. Pick the same type as your role (for example, Doctor for a doctor account, Lab technician for a lab tech account).'
