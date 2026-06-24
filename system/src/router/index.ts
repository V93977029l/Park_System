import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/main/index'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/main',
      name: 'main',
      component: () => import('../views/MainView.vue'),
      redirect: '/main/index',
      children: [
        {
          path: 'index',
          name: 'index',
          component: () => import('../views/IndexView.vue')
        },
        {
          path: 'parks',
          name: 'parks',
          component: () => import('../views/park/ParkView.vue')
        },
        {
          path: 'slots',
          name: 'slots',
          component: () => import('../views/park/SlotView.vue')
        },
        {
          path: 'entry',
          name: 'entry',
          component: () => import('../views/park/EntryView.vue')
        },
        {
          path: 'exit',
          name: 'exit',
          component: () => import('../views/park/ExitView.vue')
        },
        {
          path: 'records',
          name: 'records',
          component: () => import('../views/park/RecordView.vue')
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/admin/users/UserList.vue')
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('../views/admin/roles/RoleList.vue')
        },
        {
          path: 'userAddRoles',
          name: 'userAddRoles',
          component: () => import('../views/admin/users/UserAddRoles.vue')
        }
      ]
    }
  ]
})

export default router
