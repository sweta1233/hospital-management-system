/**
 * Authentication & RBAC utility helpers.
 */

export const getUserRoles = (user) => {
  if (!user) return []
  const roleNames = []

  if (user.primary_role && typeof user.primary_role === 'string') {
    roleNames.push(user.primary_role.toLowerCase())
  }

  if (Array.isArray(user.roles)) {
    user.roles.forEach((r) => {
      if (typeof r === 'string') {
        const val = r.toLowerCase()
        if (!roleNames.includes(val)) roleNames.push(val)
      } else if (r && typeof r === 'object' && r.name) {
        const val = r.name.toLowerCase()
        if (!roleNames.includes(val)) roleNames.push(val)
      }
    })
  }

  return roleNames
}

export const hasAnyRole = (user, allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) return true
  const userRoles = getUserRoles(user)
  return allowedRoles.some((role) => userRoles.includes(role.toLowerCase()))
}
