import { createRouter, createWebHistory } from 'vue-router'
import { useAuth, ROLE_PERMISSIONS } from '@/composables/useAuth'

export const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/login/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/dashboard/Dashboard.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager', 'staff', 'viewer'] },
  },
  {
    path: '/pos',
    name: 'Pos',
    component: () => import('@/pages/pos/Pos.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager', 'staff'] },
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('@/pages/product/list/ProductList.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager'] },
  },
  {
    path: '/products/create',
    name: 'ProductCreate',
    component: () => import('@/pages/product/create/ProductCreate.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager'] },
  },
  {
    path: '/ingredients',
    name: 'IngredientList',
    component: () => import('@/pages/ingredient/list/IngredientList.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager'] },
  },
  {
    path: '/ingredients/create',
    name: 'IngredientCreate',
    component: () => import('@/pages/ingredient/create/IngredientCreate.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager'] },
  },
  {
    path: '/stock-imports/create',
    name: 'StockImportCreate',
    component: () => import('@/pages/stockImport/create/StockImportCreate.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager'] },
  },
  {
    path: '/users',
    name: 'UserList',
    component: () => import('@/pages/user/list/UserList.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/users/create',
    name: 'UserCreate',
    component: () => import('@/pages/user/create/UserCreate.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/reports/sales',
    name: 'SalesReport',
    component: () => import('@/pages/report/sales/SalesReport.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager', 'staff', 'viewer'] },
  },
  {
    path: '/error',
    name: 'ErrorPage',
    component: () => import('@/pages/error/ErrorPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFoundPage',
    component: () => import('@/pages/error/notFound/NotFoundPage.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const { isLoggedIn, role } = useAuth()

  if (to.path === '/login') {
    return next()
  }

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return next('/login')
  }

  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const currentRole = role.value || 'admin'
    if (!to.meta.roles.includes(currentRole)) {
      // Redirect to the user's first allowed page
      const allowedPaths = ROLE_PERMISSIONS[currentRole] || ['/']
      const fallbackPath = allowedPaths[0] || '/'
      if (to.path !== fallbackPath) {
        return next(fallbackPath)
      }
    }
  }

  next()
})
