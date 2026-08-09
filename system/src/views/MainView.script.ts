import { computed, ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeFilled, OfficeBuilding, Grid,
  User, Setting, ArrowDown, SwitchButton,
  Location, ScaleToOriginal, Tickets
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const username = ref(localStorage.getItem('park_username') || 'admin')
const roleName = ref(localStorage.getItem('park_role') || '系统管理员')

const stats = reactive({
  liveParking: 186,
  todayExit: 73,
  todayRevenue: '28,460'
})

const navItems = [
  { path: '/main/index', label: '总览', icon: HomeFilled },
  { path: '/main/parks', label: '停车场', icon: OfficeBuilding },
  { path: '/main/slots', label: '车位', icon: Grid },
  { path: '/main/entry', label: '车辆入场', icon: Location, badge: '3' },
  { path: '/main/exit', label: '车辆出场', icon: ScaleToOriginal },
  { path: '/main/records', label: '收费记录', icon: Tickets }
]

const tileRingItems = [
  { path: '/main/index', label: '总览', sub: '运营全景', icon: HomeFilled },
  { path: '/main/parks', label: '停车场', sub: '6 座场地', icon: OfficeBuilding },
  { path: '/main/slots', label: '车位', sub: '3,200 泊位', icon: Grid },
  { path: '/main/entry', label: '入场', sub: '入口识别', icon: Location },
  { path: '/main/exit', label: '出场', sub: '结算放行', icon: ScaleToOriginal },
  { path: '/main/records', label: '收费', sub: '流水明细', icon: Tickets }
]

const ringOpen = ref(false)

const routeTitle: Record<string, { eyebrow: string; title: string }> = {
  '/main/index':   { eyebrow: 'OVERVIEW',     title: '运营总览' },
  '/main/parks':    { eyebrow: 'PARK LOTS',    title: '停车场管理' },
  '/main/slots':    { eyebrow: 'SLOTS',        title: '车位总览' },
  '/main/entry':    { eyebrow: 'ENTRY',        title: '车辆入场' },
  '/main/exit':     { eyebrow: 'EXIT',         title: '车辆出场' },
  '/main/records':  { eyebrow: 'RECORDS',      title: '收费记录' },
  '/main/users':    { eyebrow: 'USERS',        title: '用户管理' },
  '/main/roles':    { eyebrow: 'ROLES',         title: '角色管理' },
  '/main/userAddRoles': { eyebrow: 'PERMISSIONS', title: '角色授权' }
}

const matchSeg = (full: string, path: string) =>
  full === path || full.startsWith(path + '/')

const isActive = (path: string) => matchSeg(route.path, path)

const pageTitle = computed(() => routeTitle[route.path]?.title ?? '控制台')
const eyebrow   = computed(() => routeTitle[route.path]?.eyebrow ?? 'CONSOLE')

const gotoTile = (p: string) => {
  ringOpen.value = false
  router.push(p)
}

const onUserCmd = (cmd: string) => {
  if (cmd === 'logout') {
    localStorage.removeItem('park_token')
    localStorage.removeItem('park_username')
    localStorage.removeItem('park_role')
    router.push('/login')
  } else if (cmd === 'profile') {
    router.push('/main/users')
  }
}
