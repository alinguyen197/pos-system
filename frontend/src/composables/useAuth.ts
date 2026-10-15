import { ref, computed } from 'vue'

export interface AuthUser {
  id?: number
  name?: string
  email?: string
  role?: string
  status?: string
  avatarUrl?: string
}

// Role-based Screen Permissions Matrix
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    '/',
    '/pos',
    '/products',
    '/products/create',
    '/ingredients',
    '/ingredients/create',
    '/stock-imports/create',
    '/expenditures',
    '/promotions',
    '/users',
    '/users/create',
    '/reports/sales',
  ],
  manager: [
    '/',
    '/pos',
    '/products',
    '/products/create',
    '/ingredients',
    '/ingredients/create',
    '/stock-imports/create',
    '/expenditures',
    '/promotions',
    '/reports/sales',
  ],
  staff: ['/', '/pos', '/expenditures', '/reports/sales'],
  viewer: ['/', '/expenditures', '/reports/sales'],
}

const getStoredUser = (): AuthUser => {
  try {
    const data = localStorage.getItem('user')
    if (data) return JSON.parse(data)
  } catch {
    /* empty */
  }
  const storedRole = localStorage.getItem('role')
  const storedName =
    localStorage.getItem('fullName') || localStorage.getItem('userName')
  const storedEmail = localStorage.getItem('email')
  if (storedRole || storedName || storedEmail) {
    return {
      name: storedName || 'User',
      email: storedEmail || undefined,
      role: storedRole || 'admin',
    }
  }
  return {}
}

const currentUser = ref<AuthUser>(getStoredUser())
const token = ref<string | null>(localStorage.getItem('token'))

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => currentUser.value.role || 'admin')

  const setAuth = (newToken: string, user: AuthUser) => {
    token.value = newToken
    currentUser.value = user
    localStorage.setItem('token', newToken)
    localStorage.setItem('role', user.role || 'admin')
    localStorage.setItem('user', JSON.stringify(user))
    if (user.name) {
      localStorage.setItem('fullName', user.name)
      localStorage.setItem('userName', user.name)
    }
    if (user.email) {
      localStorage.setItem('email', user.email)
    }
  }

  const logout = () => {
    token.value = null
    currentUser.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    localStorage.removeItem('fullName')
    localStorage.removeItem('userName')
    localStorage.removeItem('email')
  }

  const isAllowedRoute = (path: string, userRole?: string): boolean => {
    const targetRole = userRole || role.value || 'admin'
    const allowedPaths =
      ROLE_PERMISSIONS[targetRole] || ROLE_PERMISSIONS['admin']

    if (allowedPaths.includes(path)) return true

    // Prefix matching for child routes (e.g. /products/create)
    return allowedPaths.some((p) => p !== '/' && path.startsWith(p))
  }

  return {
    isLoggedIn,
    role,
    currentUser,
    token,
    setAuth,
    logout,
    isAllowedRoute,
  }
}
