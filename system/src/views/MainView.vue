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
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeFilled, OfficeBuilding, Grid, Tickets,
  User, Setting, ArrowDown, SwitchButton, Location
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const username = ref(localStorage.getItem('park_username') || 'admin')
const roleName = ref(localStorage.getItem('park_role') || '系统管理员')

const stats = reactive({ liveParking: 186, todayExit: 73, todayRevenue: '28,460' })

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
</style>
