import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/main/index' },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    {
      path: '/main',
      name: 'main',
      component: () => import('../views/MainView.vue'),
      redirect: '/main/index',
      children: [
        { path: 'index',      name: 'index',      component: () => import('../views/IndexView.vue') },
        { path: 'parks',      name: 'parks',      component: () => import('../views/park/ParkView.vue') },
        { path: 'slots',      name: 'slots',      component: () => import('../views/park/SlotView.vue') },
        { path: 'entry-exit', name: 'entry-exit', component: () => import('../views/park/EntryExitView.vue') },
        { path: 'records',    name: 'records',    component: () => import('../views/park/RecordView.vue') },
        { path: 'users',      name: 'users',      component: () => import('../views/admin/users/UserList.vue') },
        { path: 'roles',      name: 'roles',      component: () => import('../views/admin/roles/RoleList.vue') }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  if (to.path === '/login') return next()
  const token = localStorage.getItem('park_token')
  if (!token && to.path !== '/login') return next('/login')
  next()
})

export default router
