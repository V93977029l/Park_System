<template>
  <div class="layout-root">
    <header class="topbar">
      <div class="topbar__left">
        <div class="brand">
          <div class="brand__mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M7 7h4v4H7z" fill="currentColor" opacity="0.85"/>
              <path d="M13 7h4v4h-4zM7 13h4v4H7zM13 13h4v4h-4z" fill="currentColor" opacity="0.35"/>
            </svg>
          </div>
          <div class="brand__text">
            <span class="brand__name">智慧停车</span>
            <span class="brand__sub">SMART PARKING</span>
          </div>
        </div>

        <nav class="caps-nav">
          <button
            v-for="item in navItems"
            :key="item.path"
            class="caps-nav__item"
            :class="{ 'is-active': isActive(item.path) }"
            @click="router.push(item.path)"
          >
            <el-icon class="caps-nav__ico"><component :is="item.icon" /></el-icon>
            <span class="caps-nav__label">{{ item.label }}</span>
            <span v-if="item.badge" class="caps-nav__badge">{{ item.badge }}</span>
          </button>
        </nav>
      </div>

      <div class="topbar__right">
        <div class="status-pill">
          <span class="status-pill__label">在线</span>
          <span class="status-pill__value">{{ stats.liveParking }}</span>
        </div>
        <div class="status-pill">
          <span class="status-pill__label">今日出场</span>
          <span class="status-pill__value">{{ stats.todayExit }}</span>
        </div>
        <div class="status-pill">
          <span class="status-pill__label">今日营收</span>
          <span class="status-pill__value status-pill__value--money">{{ stats.todayRevenue }}</span>
        </div>
        <div class="topbar__divider"/>
        <el-dropdown trigger="click" @command="onUserCmd">
          <div class="user-chip">
            <div class="user-chip__avatar"><el-icon><User /></el-icon></div>
            <div class="user-chip__meta">
              <div class="user-chip__name">{{ username }}</div>
              <div class="user-chip__role">{{ roleName }}</div>
            </div>
            <el-icon class="user-chip__caret"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile"><el-icon><Setting /></el-icon>账号设置</el-dropdown-item>
              <el-dropdown-item command="logout" divided><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="main-stage">
      <div class="breadcrumb-row">
        <div class="breadcrumb-title">
          <span class="breadcrumb-title__eyebrow">{{ eyebrow }}</span>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="breadcrumb-trail">
          <span class="breadcrumb-trail__item">控制台</span>
          <span class="breadcrumb-trail__sep">/</span>
          <span class="breadcrumb-trail__item breadcrumb-trail__item--active">{{ pageTitle }}</span>
        </div>
      </div>

      <section class="content-area">
        <router-view v-slot="{ Component, route }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </section>
    </main>

    <!-- 磨砂玻璃背景（必须放在带 transform 的 .float-fan 之外，才能 fixed 全屏） -->
    <transition name="blur-fade">
      <div
        v-if="floatOpen"
        class="float-fan__backdrop"
        :style="{ '--cx': backdropCenter.x + 'px', '--cy': backdropCenter.y + 'px' }"
        @click="closeFloat"
      >
        <svg class="float-fan__noise" aria-hidden="true">
          <filter id="glassNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#glassNoise)" />
        </svg>
      </div>
    </transition>

    <!-- 悬浮球：环形扇区放射菜单 -->
    <div class="float-fan" :style="{ transform: `translate(${drag.x}px, ${drag.y}px)` }">
      <svg class="float-fan__svg" viewBox="0 0 340 340">
        <path
          v-for="(item, i) in floatItems"
          :key="item.path"
          class="float-fan__arc"
          :class="{ 'is-open': floatOpen, 'is-active': isActive(item.path) }"
          :d="arcD(i)"
          :style="{
            '--fd': (i * 40) + 'ms',
            '--sc': arcScale(i)
          }"
          @mouseenter="hovered = i"
          @mouseleave="hovered = -1"
          @click="goFloat(item.path)"
        />
      </svg>

      <button
        v-for="(item, i) in floatItems"
        :key="item.path"
        class="float-fan__label"
        :class="{ 'is-open': floatOpen, 'is-active': isActive(item.path) }"
        :style="labelPos(i)"
        @mouseenter="hovered = i"
        @mouseleave="hovered = -1"
        @click="goFloat(item.path)"
      >
        <el-icon class="float-fan__label-ico"><component :is="item.icon" /></el-icon>
        <span class="float-fan__label-txt">{{ item.label }}</span>
      </button>

      <button
        class="float-fan__toggle"
        :class="{ 'is-open': floatOpen }"
        @pointerdown="onDragStart"
      >
        <el-icon class="float-fan__toggle-ico"><Expand /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeFilled, OfficeBuilding, Grid, Tickets,
  User, Setting, ArrowDown, SwitchButton, Location, UserFilled, Expand
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const username = ref(localStorage.getItem('park_username') || 'admin')
const roleName = ref(localStorage.getItem('park_role') || '系统管理员')

const stats = reactive({ liveParking: 186, todayExit: 73, todayRevenue: '28,460' })

// —— 悬浮球导航：环形扇区放射菜单 ——
const floatOpen = ref(false)
const hovered = ref(-1)
const floatItems = [
  { path: '/main/index',      label: '总览',   icon: HomeFilled },
  { path: '/main/parks',      label: '停车场', icon: OfficeBuilding },
  { path: '/main/slots',      label: '车位',   icon: Grid },
  { path: '/main/entry-exit', label: '进出厂', icon: Location },
  { path: '/main/records',    label: '收费',   icon: Tickets },
  { path: '/main/users',      label: '用户',   icon: User },
  { path: '/main/roles',      label: '角色',   icon: UserFilled }
]
// 环形几何参数（viewBox 340x340，圆心 170,170）
const FC = 170
const R_MID = 118
const STEP = 360 / floatItems.length
const GAP = 4
const d2r = (d: number) => (d * Math.PI) / 180
// 圆头扇形弧段（宽笔画 + linecap round = 圆角扇形）
const arcD = (i: number, r = R_MID) => {
  const a0 = i * STEP + GAP / 2
  const a1 = (i + 1) * STEP - GAP / 2
  const x0 = FC + r * Math.cos(d2r(a0))
  const y0 = FC + r * Math.sin(d2r(a0))
  const x1 = FC + r * Math.cos(d2r(a1))
  const y1 = FC + r * Math.sin(d2r(a1))
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
}
// 每个扇区中心放图标文字
const labelPos = (i: number) => {
  const mid = i * STEP + STEP / 2
  const x = FC + R_MID * Math.cos(d2r(mid))
  const y = FC + R_MID * Math.sin(d2r(mid))
  return { left: x.toFixed(1) + 'px', top: y.toFixed(1) + 'px', '--fd': i * 40 + 'ms' }
}
// hover 缩放：当前扇区放大、相邻略放大（灵动挤出感）
const arcScale = (i: number) => {
  const h = hovered.value
  if (h === -1) return 1
  const g = Math.abs(i - h)
  if (g === 0) return 1.16
  if (g === 1) return 1.05
  return 1
}
const toggleFloat = () => { floatOpen.value = !floatOpen.value }
const closeFloat = () => { floatOpen.value = false; hovered.value = -1 }
const goFloat = (p: string) => { closeFloat(); router.push(p) }

// 磨砂玻璃中心跟随悬浮球位置（圆心在悬浮球，相对视口右下）
const backdropCenter = computed(() => ({
  x: (window.innerWidth - 28 - 170) + drag.x,
  y: (window.innerHeight - 28 - 170) + drag.y
}))

// —— 拖动 ——
const drag = reactive({ x: 0, y: 0 })
let dragging = false
let moved = false
let startX = 0
let startY = 0
const onDragStart = (e: PointerEvent) => {
  dragging = true
  moved = false
  startX = e.clientX - drag.x
  startY = e.clientY - drag.y
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd)
}
const onDragMove = (e: PointerEvent) => {
  if (!dragging) return
  if (Math.abs(e.clientX - startX - drag.x) + Math.abs(e.clientY - startY - drag.y) > 5) moved = true
  drag.x = e.clientX - startX
  drag.y = e.clientY - startY
}
const onDragEnd = () => {
  dragging = false
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', onDragEnd)
  if (!moved) toggleFloat()
}


const navItems = [
  { path: '/main/index',      label: '总览',     icon: HomeFilled },
  { path: '/main/parks',      label: '停车场',   icon: OfficeBuilding },
  { path: '/main/slots',      label: '车位',     icon: Grid },
  { path: '/main/entry-exit', label: '进出厂',   icon: Location, badge: '3' },
  { path: '/main/records',    label: '收费记录', icon: Tickets }
]

const routeTitle: Record<string, { eyebrow: string; title: string }> = {
  '/main/index':      { eyebrow: 'OVERVIEW',     title: '运营总览' },
  '/main/parks':      { eyebrow: 'PARK LOTS',    title: '停车场管理' },
  '/main/slots':      { eyebrow: 'SLOTS',        title: '车位总览' },
  '/main/entry':      { eyebrow: 'ENTRY',        title: '车辆入场' },
  '/main/exit':       { eyebrow: 'EXIT',         title: '车辆出场' },
  '/main/entry-exit': { eyebrow: 'FLOW',         title: '车辆出入厂' },
  '/main/records':    { eyebrow: 'RECORDS',      title: '收费记录' },
  '/main/users':      { eyebrow: 'USERS',        title: '用户管理' },
  '/main/roles':      { eyebrow: 'ROLES',        title: '角色管理' }
}

const matchSeg = (full: string, p: string) => full === p || full.startsWith(p + '/')
const isActive = (p: string) => matchSeg(route.path, p)
const pageTitle = computed(() => routeTitle[route.path]?.title ?? '控制台')
const eyebrow   = computed(() => routeTitle[route.path]?.eyebrow ?? 'CONSOLE')

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
</script>

<style scoped>
.layout-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.85);
  backdrop-filter: saturate(160%) blur(14px);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  gap: 16px;
}
.topbar__left  { display: flex; align-items: center; gap: 20px; flex: 0 0 auto; }
.topbar__right { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }

.brand { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.brand__mark {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, #2f6fff, #6aa3ff); color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(47,111,255,0.25); flex: 0 0 auto;
}
.brand__text { line-height: 1.15; flex: 0 0 auto; }
.brand__name { font-size: 14px; font-weight: 700; color: var(--app-text-1); letter-spacing: 0.02em; white-space: nowrap; }
.brand__sub  { font-size: 10px; font-weight: 600; color: var(--app-text-3); letter-spacing: 0.14em; white-space: nowrap; }

.caps-nav {
  display: flex; align-items: center;
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
  flex: 0 0 auto;
}
.caps-nav__item {
  all: unset; cursor: pointer;
  height: 36px; padding: 0 16px; border-radius: 999px;
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 500;
  color: var(--app-text-2);
  transition: background var(--app-transition), color var(--app-transition), box-shadow var(--app-transition);
  white-space: nowrap; flex: 0 0 auto;
}
.caps-nav__ico { font-size: 14px; }
.caps-nav__item:hover { color: var(--app-text-1); background: rgba(255,255,255,0.6); }
.caps-nav__item.is-active {
  background: #fff; color: var(--app-accent);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.05);
}
.caps-nav__badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 16px; height: 16px; padding: 0 5px; border-radius: 999px;
  font-size: 10px; font-weight: 700; color: #fff; background: var(--app-danger); margin-left: 2px;
}

.status-pill {
  display: flex; align-items: center; gap: 8px;
  height: 32px; padding: 0 12px; border-radius: 999px;
  background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);
  white-space: nowrap; flex: 0 0 auto;
}
.status-pill__label { font-size: 11px; color: var(--app-text-3); letter-spacing: 0.02em; white-space: nowrap; }
.status-pill__value { font-size: 13.5px; font-weight: 700; color: var(--app-text-1); font-variant-numeric: tabular-nums; white-space: nowrap; }
.status-pill__value--money { color: var(--app-accent); }

.topbar__divider { width: 1px; height: 20px; background: var(--app-border-strong); flex: 0 0 auto; }

.user-chip {
  cursor: pointer; display: flex; align-items: center; gap: 10px;
  height: 36px; padding: 4px 8px 4px 4px; border-radius: 999px;
  transition: background var(--app-transition); flex: 0 0 auto;
  white-space: nowrap;
}
.user-chip:hover { background: rgba(0,0,0,0.04); }
.user-chip__avatar {
  width: 30px; height: 30px; border-radius: 999px;
  background: linear-gradient(135deg, #2f6fff, #6aa3ff); color: #fff;
  display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
}
.user-chip__meta { line-height: 1.2; flex: 0 0 auto; }
.user-chip__name { font-size: 12.5px; font-weight: 600; color: var(--app-text-1); white-space: nowrap; }
.user-chip__role { font-size: 10.5px; color: var(--app-text-3); letter-spacing: 0.02em; white-space: nowrap; }
.user-chip__caret { font-size: 12px; color: var(--app-text-4); flex: 0 0 auto; }

@media (max-width: 1200px) {
  .caps-nav__item .caps-nav__label { display: none; }
  .caps-nav__item { padding: 0 12px; }
}
@media (max-width: 900px) {
  .status-pill, .topbar__divider, .user-chip__meta, .user-chip__caret { display: none; }
}

.main-stage { flex: 1; display: flex; flex-direction: column; padding: 20px 24px 32px; min-height: 0; }
.breadcrumb-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
.breadcrumb-title { display: flex; align-items: baseline; gap: 12px; }
.breadcrumb-title__eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.22em; color: var(--app-text-4); white-space: nowrap; }
.breadcrumb-title h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; color: var(--app-text-1); white-space: nowrap; }
.breadcrumb-trail { font-size: 12px; color: var(--app-text-3); display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.breadcrumb-trail__sep { color: var(--app-text-4); }
.breadcrumb-trail__item--active { color: var(--app-text-1); font-weight: 500; }
@media (max-width: 820px) { .breadcrumb-trail { display: none; } }

.content-area { flex: 1; min-height: 0; }

.page-fade-enter-active, .page-fade-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.page-fade-enter-from { opacity: 0; transform: translateY(4px); }
.page-fade-leave-to   { opacity: 0; transform: translateY(-3px); }

/* —— 悬浮球：环形扇区放射菜单 —— */
.float-fan {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 70;
  width: 340px;
  height: 340px;
}

.float-fan__backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow: hidden;
  backdrop-filter: saturate(140%) blur(10px);
  -webkit-backdrop-filter: saturate(140%) blur(10px);
  /* 内圈强、外圈弱的径向白雾 */
  background: radial-gradient(
    circle at var(--cx, 82%) var(--cy, 84%),
    rgba(255,255,255,0.32) 0%,
    rgba(255,255,255,0.12) 30%,
    rgba(255,255,255,0) 62%
  );
  /* 边缘高光：内阴影模拟玻璃切边反光 */
  box-shadow: inset 0 0 80px rgba(255,255,255,0.5);
  /* 径向蒙版：从中心(悬浮球)到边缘磨砂强度递减 */
  -webkit-mask-image: radial-gradient(
    circle at var(--cx, 82%) var(--cy, 84%),
    #000 0%,
    rgba(0,0,0,0.9) 26%,
    rgba(0,0,0,0) 66%
  );
  mask-image: radial-gradient(
    circle at var(--cx, 82%) var(--cy, 84%),
    #000 0%,
    rgba(0,0,0,0.9) 26%,
    rgba(0,0,0,0) 66%
  );
}
/* 磨砂颗粒噪点纹理 */
.float-fan__noise {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.7;
  mix-blend-mode: soft-light;
  pointer-events: none;
}

.float-fan__svg {
  position: absolute;
  inset: 0;
  width: 340px;
  height: 340px;
  overflow: visible;
  z-index: 71;
}

.float-fan__arc {
  fill: none;
  stroke: rgba(255,255,255,0.96);
  stroke-width: 76;
  stroke-linecap: round;
  stroke-linejoin: round;
  cursor: pointer;
  opacity: 0;
  transform: scale(0);
  transform-origin: 170px 170px;
  transition:
    transform 320ms cubic-bezier(0.22,1,0.36,1) var(--fd, 0ms),
    opacity 200ms ease var(--fd, 0ms),
    stroke var(--app-transition);
}
.float-fan__arc.is-open {
  opacity: 1;
  transform: scale(var(--sc, 1));
}
.float-fan__arc.is-active {
  stroke: rgba(47,111,255,0.22);
}
.float-fan__arc:hover {
  stroke: rgba(47,111,255,0.16);
}

.float-fan__label {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  z-index: 72;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 2px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-md);
  color: var(--app-text-2);
  cursor: pointer;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0);
  transition:
    transform 300ms cubic-bezier(0.22,1,0.36,1) var(--fd, 0ms),
    opacity 200ms ease var(--fd, 0ms),
    border-color var(--app-transition),
    color var(--app-transition);
}
.float-fan__label.is-open {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
.float-fan__label.is-active {
  color: var(--app-accent);
  border-color: var(--app-accent-line);
}
.float-fan__label:hover { color: var(--app-accent); }
.float-fan__label-ico { font-size: 17px; }
.float-fan__label-txt { font-size: 10px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; }

.float-fan__toggle {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 73;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-accent);
  background: #fff;
  box-shadow: var(--app-shadow-md);
  cursor: grab;
  transition: transform 300ms cubic-bezier(0.22,1,0.36,1), box-shadow var(--app-transition);
}
.float-fan__toggle:active { cursor: grabbing; }
.float-fan__toggle:hover { box-shadow: var(--app-shadow-lg); }
.float-fan__toggle.is-open { transform: translate(-50%, -50%) rotate(45deg); }
.float-fan__toggle-ico { font-size: 22px; }

.blur-fade-enter-active, .blur-fade-leave-active { transition: opacity 260ms ease; }
.blur-fade-enter-from, .blur-fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .float-fan { right: 16px; bottom: 16px; }
}
</style>
