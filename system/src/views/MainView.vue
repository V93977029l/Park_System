<template>
  <el-container class="layout">
    <el-header class="header" style="background-image: url('/header_background.jpg');">
      <div class="header-left">
        <el-icon :size="22" color="#409EFF"><HomeFilled /></el-icon>
        <span class="header-title">智慧停车场管理系统</span>
      </div>
      <div class="header-right">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/main/index' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="28" :src="avatarUrl">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="username">{{ username }}</span>
            <el-icon><CaretBottom /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><UserFilled /></el-icon>个人中心
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <el-aside width="220px" class="aside">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          :router="true"
          background-color="#1f2d3d"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          unique-opened
        >
          <el-menu-item index="/main/index">
            <el-icon><DataAnalysis /></el-icon>
            <span>工作台首页</span>
          </el-menu-item>

          <el-sub-menu index="park">
            <template #title>
              <el-icon><OfficeBuilding /></el-icon>
              <span>停车场管理</span>
            </template>
            <el-menu-item index="/main/parks">
              <el-icon><Place /></el-icon>
              <span>停车场管理</span>
            </el-menu-item>
            <el-menu-item index="/main/slots">
              <el-icon><Grid /></el-icon>
              <span>车位管理</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="biz">
            <template #title>
              <el-icon><Tickets /></el-icon>
              <span>收费业务</span>
            </template>
            <el-menu-item index="/main/entry">
              <el-icon><CirclePlus /></el-icon>
              <span>车辆入场</span>
            </el-menu-item>
            <el-menu-item index="/main/exit">
              <el-icon><CircleClose /></el-icon>
              <span>车辆出场</span>
            </el-menu-item>
            <el-menu-item index="/main/records">
              <el-icon><Document /></el-icon>
              <span>收费记录</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="auth">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/main/users">
              <el-icon><User /></el-icon>
              <span>用户列表</span>
            </el-menu-item>
            <el-menu-item index="/main/roles">
              <el-icon><UserFilled /></el-icon>
              <span>角色列表</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  HomeFilled, User, UserFilled, SwitchButton, CaretBottom,
  OfficeBuilding, Place, Grid, Tickets, CirclePlus, CircleClose, Document, Setting, DataAnalysis
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const username = ref(sessionStorage.getItem('username') || '管理员')
const avatarUrl = ref('')

const menus = [
  '/main/index',
  '/main/parks', '/main/slots',
  '/main/entry', '/main/exit', '/main/records',
  '/main/users', '/main/roles'
]

const activeMenu = computed(() => {
  if (menus.includes(route.path)) return route.path
  return '/main/index'
})

const menuTitleMap: Record<string, string> = {
  '/main/index': '工作台首页',
  '/main/parks': '停车场管理',
  '/main/slots': '车位管理',
  '/main/entry': '车辆入场',
  '/main/exit': '车辆出场',
  '/main/records': '收费记录',
  '/main/users': '用户列表',
  '/main/roles': '角色列表'
}

const currentTitle = computed(() => menuTitleMap[route.path] || '首页')

const handleCommand = async (cmd: string) => {
  if (cmd === 'profile') {
    ElMessage.info('个人中心功能开发中')
  } else if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确认退出登录？', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
      sessionStorage.removeItem('username')
      ElMessage.success('已退出登录')
      router.replace('/login')
    } catch {
      // cancel
    }
  }
}
</script>

<style scoped lang="scss">
.layout { height: 100vh; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff center/cover no-repeat;
  background-blend-mode: overlay;
  background-color: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  height: 60px;
  box-sizing: border-box;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-title { font-size: 18px; font-weight: 600; color: #303133; }
.header-right { display: flex; align-items: center; gap: 24px; }
.user-info {
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
  padding: 6px 12px; border-radius: 4px; transition: background 0.2s;
  &:hover { background: #f2f6fc; }
}
.username { color: #303133; font-size: 14px; }
.aside { background-color: #1f2d3d; overflow-y: auto; }
.menu { border-right: none; }
.main { background-color: #f0f2f5; padding: 16px; overflow-y: auto; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
