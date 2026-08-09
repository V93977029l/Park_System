# 智慧停车管理系统 · 设计文档

> 本文档记录系统的全部设计理念、架构决策、组件结构、路由系统、样式体系、数据流及开发过程中的关键思考。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈与依赖](#2-技术栈与依赖)
3. [项目目录结构](#3-项目目录结构)
4. [设计理念](#4-设计理念)
5. [路由系统](#5-路由系统)
6. [布局系统](#6-布局系统)
7. [页面详解](#7-页面详解)
8. [样式体系](#8-样式体系)
9. [数据流与状态管理](#9-数据流与状态管理)
10. [HTTP 层](#10-http-层)
11. [组件化设计](#11-组件化设计)
12. [构建与开发流程](#12-构建与开发流程)
13. [设计演化史](#13-设计演化史)
14. [已知问题与待办](#14-已知问题与待办)

---

## 1. 项目概述

**智慧停车管理系统** 是一个面向大学课程设计的前端演示项目（用户明确说明："这是大学课程设计"），模拟停车场日常运营的数字化管理界面。系统覆盖了从 **停车场管理 → 车位总览 → 车辆入场登记/出场结算 → 收费记录查询 → 用户/角色权限管理** 的完整业务闭环。

### 1.1 核心目标

- 提供一个"高联通、高响应、符合直觉"的运营总览面板
- 模拟真实停车场管理系统的核心业务流程
- 使用全前端 Mock 数据，无需后端服务即可演示
- UI 风格参考游戏化仪表盘，追求沉浸感和数据可视化

### 1.2 业务范围

| 模块 | 功能 |
|------|------|
| 运营总览 | 实时 KPI（在场车辆、空闲车位、平均时长）、ECharts 趋势图/饼图、各场地占用率、快速通道入口 |
| 停车场管理 | 停车场列表（12 座）、新增/编辑/下线、占用率进度条、今日营收、跳转车位 |
| 车位总览 | 楼层平面图（4 层 × 120 车位）、列表视图、实时热力图、车位状态（空闲/占用/预约/故障） |
| 车辆进出厂 | 入场登记（表单 + 摄像头模拟 + 置信度）、出场结算（费用明细对话框 + 筛选）、入场/出场记录表格 |
| 收费记录 | 订单列表（50 条模拟数据）、多维度筛选（日期/停车场/车牌/支付方式）、统计汇总（总营收/客单价/车次/平均时长）、ECharts 热力图/趋势图、CSV 导出 |
| 用户管理 | 用户列表 CRUD、头像上传（Base64）、角色分配 |
| 角色管理 | 角色列表 CRUD |
| 商户管理 | 商户列表 CRUD、Logo 上传、状态切换 |

### 1.3 用户原始需求清单

以下是从用户原始诉求到最终实现的完整需求映射，记录了用户每一条原始指令及其对应的设计决策：

| # | 用户原始诉求 | 实现状态 | 对应设计决策 |
|---|-------------|----------|-------------|
| 1 | 从民宿管理系统改为停车场管理系统 | ✅ 已实现 | 全系统改为停车场业务，原 RoomList.vue 标记为遗留文件 |
| 2 | "别再是一横一竖的结构了" — 否定传统侧边栏布局 | ✅ 已实现 | 彻底移除左侧菜单栏，改为顶栏胶囊 tab + 运营总览仪表盘 |
| 3 | "应做得像电子游戏的 UI 那样立体" | ✅ 已实现 | 毛玻璃顶栏、卡片上浮动画、数据可视化仪表盘、磁贴环（后废弃） |
| 4 | "一个主控面板内可以宏观观察所有内容" | ✅ 已实现 | IndexView 作为运营总览，6 个统计卡片 + 4 个面板 + 快速通道 |
| 5 | "高联通、高相应、符合直觉的在各个界面间跳转" | ✅ 已实现 | 统计卡片可点击跳转、快速通道按钮、顶栏胶囊导航 |
| 6 | 基于 Element Plus 实装登录和菜单功能 | ✅ 已实现 | 登录页表单校验 + 注册对话框 + 路由守卫 |
| 7 | 表格的添加/删除按钮 | ✅ 已实现 | 所有 CRUD 页面（Park/Slot/User/Role/Business）均有添加/删除 |
| 8 | 修改和增加对话框加上上传文件 | ✅ 已实现 | UserList 头像上传（Base64）、BusinessView Logo 上传 |
| 9 | 默认访问 IndexView 还要轮播图 | ⚠️ 部分实现 | 首页默认访问 OK，但轮播图最终未实现（改为统计卡片替代） |
| 10 | 集成 ECharts 图表 | ✅ 已实现 | IndexView 趋势图/饼图、SlotView 热力图、RecordView 热力图/趋势图 |
| 11 | 菜鸟图库参考：public/ 和 assets/ 图片放置方式 | ✅ 已记录 | 见下方 1.4 节 |
| 12 | 解决 UI 和文字遮蔽、挤压变形 | ✅ 已实现 | white-space:nowrap、flex:0 0 auto、媒体查询断点 |
| 13 | 磁贴环遮蔽视野 | ✅ 已解决 | 最终决策：废弃磁贴环，只保留顶栏胶囊一种入口 |
| 14 | "悬浮文字和上翻更多功能定位重复" | ✅ 已解决 | 统一为顶栏导航，消除双重入口 |
| 15 | 合并入场/出场为同一页面 | ✅ 已实现 | EntryExitView.vue，tab 切换 |
| 16 | 页面折叠/展开：默认收起统计，展开显示全部 | ⏳ 待办 | 列入功能待办 |

### 1.4 参考来源

**用户提供的参考网站：**

1. **菜鸟图库** (https://www.sucai999.com/) — 用户提供此网站作为图片资源放置方式的参考。用户询问了 public/ 和 assets/ 下图片调用方式的区别：
   - `public/` 文件夹下的图片：通过根路径直接引用，如 `<img src="/header_background.jpg">`，不会被 Vite 处理
   - `src/assets/` 文件夹下的图片：通过 import 或相对路径引用，会经过 Vite 的构建处理（hash 命名、压缩等）
   - 当前项目策略：背景图和环境图片放在 `public/`，业务图片（头像、Logo）放在 `src/assets/`

2. **ECharts 官网** (https://echarts.apache.org/zh/index.html) — 用户提供此网站作为数据可视化图表的参考。系统中所有图表均使用 ECharts 实现，包括：
   - 柱状图 + 折线图组合（IndexView 趋势图）
   - 环形饼图（IndexView 收费构成）
   - 热力图（SlotView 占用率热力图、RecordView 时段车流热力图）
   - 折线图（RecordView 营收趋势）

### 1.5 项目起源

本项目最初是一个 **民宿管理系统** 的前端模板，包含 RoomList.vue（房间列表）、bussiness/ 目录等遗留文件。用户要求将其改造为 **停车场管理系统**，并经历了从"传统左右布局"→"游戏化磁贴环 UI"→"统一顶栏胶囊导航"的完整设计演化过程。

---

## 2. 技术栈与依赖

### 2.1 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.4.21 | 前端框架（Composition API + `<script setup>`） |
| TypeScript | ~5.4.0 | 类型安全 |
| Vite | ^5.2.8 | 构建工具 |
| Element Plus | ^2.7.0 | UI 组件库 |
| Vue Router | ^4.3.0 | 路由管理 |
| ECharts | ^6.1.0 | 数据可视化 |
| Axios | ^1.6.8 | HTTP 请求 |

### 2.2 开发工具

| 工具 | 用途 |
|------|------|
| vue-tsc | TypeScript 类型检查 |
| ESLint | 代码规范 |
| Prettier | 代码格式化 |
| Sass | CSS 预处理器（部分组件使用 scoped SCSS） |
| unplugin-auto-import | 自动导入 Vue API（ref、computed 等） |
| unplugin-vue-components | 自动导入 Element Plus 组件 |
| npm-run-all2 | 并行执行脚本 |

### 2.3 关键设计决策

- **不使用 Pinia/Vuex**：因为项目规模小、数据以组件内 Mock 为主，无需全局状态管理
- **不使用真实后端**：API 请求都有 fallback 到本地 Mock 数据，确保完全离线可用
- **自动导入生效**：通过 `auto-imports.d.ts` 和 `components.d.ts` 实现 ref/computed 和 Element Plus 组件的自动导入，无需手动 import

---

## 3. 项目目录结构

```
system/
├── public/                          # 静态资源
│   ├── favicon.ico
│   └── header_background.jpg
├── src/
│   ├── assets/                      # 资源文件
│   │   ├── base.css                 # Vue 初始基础样式（保留但未实际使用）
│   │   ├── global.css               # 全局样式 + CSS 变量（核心样式文件）
│   │   ├── login-bg.jpg             # 登录页背景
│   │   ├── logo.jpg / logo2.jpg     # 演示用头像/Logo
│   │   └── ...
│   ├── http/                        # HTTP 请求封装
│   │   ├── request.ts               # Axios 实例 + 拦截器
│   │   └── index.ts                 # API 接口定义（users、roles）
│   ├── router/
│   │   └── index.ts                 # 路由配置
│   ├── views/
│   │   ├── LoginView.vue            # 登录页
│   │   ├── MainView.vue             # 主布局（顶栏 + 面包屑 + 内容区 + 悬浮球）
│   │   ├── IndexView.vue            # 运营总览仪表盘
│   │   ├── park/
│   │   │   ├── ParkView.vue         # 停车场管理
│   │   │   ├── SlotView.vue         # 车位总览（平面图/列表/热力图）
│   │   │   ├── EntryExitView.vue    # 车辆出入厂（入场/出场 tab 合并）
│   │   │   ├── EntryView.vue        # [废弃] 旧车辆入场页
│   │   │   ├── ExitView.vue         # [废弃] 旧车辆出场页
│   │   │   └── RecordView.vue       # 收费记录
│   │   ├── admin/
│   │   │   ├── BusinessView.vue     # 商户管理
│   │   │   ├── users/
│   │   │   │   ├── UserList.vue     # 用户管理
│   │   │   │   └── UserAddRoles.vue # 用户分配角色
│   │   │   └── roles/
│   │   │       └── RoleList.vue     # 角色管理
│   │   └── bussiness/room/
│   │       └── RoomList.vue         # [遗留] 旧项目房间列表
│   ├── App.vue                      # 根组件
│   └── main.ts                      # 应用入口
├── index.html                       # HTML 模板
├── vite.config.ts                   # Vite 配置
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── package.json
└── DESIGN.md                        # 本文档
```

---

## 4. 设计理念

### 4.1 核心原则

**"高联通、高响应、符合直觉"** —— 这是整个 UI 重构的指导方针。

1. **高联通**：在一个主控面板内可以宏观观察所有内容，6 个核心统计卡片一键跳转到对应业务页面
2. **高响应**：鼠标悬停时卡片有上浮动画（`translateY(-2px)`）、按钮有即时反馈、页面切换有淡入淡出过渡
3. **符合直觉**：导航只有"顶栏胶囊 tab"一种入口方式，消除双重入口（悬浮磁贴环与上栏并存）带来的困惑

### 4.2 导航哲学

- **单层导航**：顶栏 5 个胶囊 tab（总览 / 停车场 / 车位 / 进出厂 / 收费记录），覆盖所有核心业务
- **二级页面合并**：车辆入场和出场合并为「进出厂」一个页面，通过 tab 切换，避免在导航栏中多占位置
- **用户下拉**：右侧用户头像下拉提供账号设置和退出登录，不再占用主导航空间
- **面包屑**：页面顶部始终显示当前页面路径（控制台 / 页面名），给用户明确的位置感
- **消除双重入口**：用户明确指出"悬浮文字和上翻更多功能定位重复"，因此最终决策只保留顶栏胶囊一种导航入口，废弃磁贴环

### 4.3 视觉语言（参考游戏 UI 设计）

**用户明确要求**："应做得像电子游戏的 UI 那样立体，一个主控面板内可以宏观的观察所有内容并且高联通高响应符合直觉的在各个界面间跳转。"

- **毛玻璃顶栏**：`backdrop-filter: saturate(160%) blur(14px)` 的半透明顶栏，在滚动时仍然保持内容可见。类似游戏 HUD 的悬浮面板效果
- **胶囊美学**：导航按钮、tab 切换、状态 pill 全部使用 `border-radius: 999px` 胶囊形状。参考游戏中的技能栏/装备栏的胶囊式布局
- **卡片上浮动效**：统计卡片 hover 时 `translateY(-2px) + box-shadow` 增强，类似游戏菜单的聚焦反馈
- **数据可视化仪表盘**：IndexView 以 ECharts 图表（趋势图/饼图/热力图）为主体，而非传统的数据表格，类似游戏中的实时数据面板
- **暗色背景 + 高亮色点缀**：摄像头区域使用深色渐变背景 + 绿色扫描线动画，模拟游戏中的监控画面
- **克制用色**：主色 `#2f6fff`（蓝色），辅以绿色（成功）、橙色（警告）、红色（危险），中性色使用 5 级灰度

### 4.4 否定传统布局的决策

**用户原话**："别再是一横一竖的结构了"。

- 传统管理系统的"左侧菜单栏 + 右侧内容区"布局被彻底否定
- 替代方案：顶栏胶囊导航（水平方向）+ 运营总览仪表盘（卡片网格）
- 这种布局更接近游戏主菜单而非企业管理后台
- 面包屑和页面标题提供位置感，弥补无侧边栏带来的导航信息缺失

### 4.5 响应式策略

- **顶栏自适应**：`@media (max-width: 1200px)` 隐藏导航文字只留图标，`@media (max-width: 900px)` 隐藏状态 pill
- **网格自适应**：统计卡片 6 列 → 3 列 → 2 列（1400px / 900px 断点）；面板 2 列 → 1 列（1100px 断点）
- **全局 white-space: nowrap**：胶囊标签、品牌名、状态 pill 等所有易被挤压的元素都禁止换行，避免文字竖排/双行

---

## 5. 路由系统

### 5.1 路由结构

```
/                    → 重定向到 /main/index
/login               → LoginView.vue（登录页，无布局）
/main                → MainView.vue（主布局容器）
  ├── /main/index       → IndexView.vue（运营总览）
  ├── /main/parks       → ParkView.vue（停车场管理）
  ├── /main/slots       → SlotView.vue（车位总览）
  ├── /main/entry-exit  → EntryExitView.vue（车辆出入厂）
  ├── /main/records     → RecordView.vue（收费记录）
  ├── /main/users       → UserList.vue（用户管理）
  └── /main/roles       → RoleList.vue（角色管理）
```

### 5.2 路由守卫

```typescript
router.beforeEach((to, _from, next) => {
  if (to.path === '/login') return next()
  const token = localStorage.getItem('park_token')
  if (!token && to.path !== '/login') return next('/login')
  next()
})
```

- 登录后 `localStorage.setItem('park_token', 'demo-token-...')` 放行
- 退出登录时清除 `park_token`、`park_username`、`park_role`

### 5.3 路由设计决策

- 子路由使用**相对路径**（如 `path: 'entry-exit'` 而非 `path: '/entry-exit'`），确保在 MainView 的 `<router-view>` 中正确渲染
- 使用 `v-slot` 作用域插槽配合 `<transition>` 实现页面切换动画（`page-fade`）
- 每个页面的 `key` 绑定为 `route.fullPath`，确保同一页面的不同参数变化时重新渲染

---

## 6. 布局系统

### 6.1 主布局（MainView.vue）

```
┌─────────────────────────────────────────────────┐
│  [品牌]  [胶囊 nav]          [状态 pill] [用户]  │  ← 顶栏 (sticky, z-index:30)
├─────────────────────────────────────────────────┤
│  面包屑标题区                                    │  ← breadcrumb-row
├─────────────────────────────────────────────────┤
│                                                 │
│              <router-view>                       │  ← 内容区
│         (page-fade 过渡动画)                      │
│                                                 │
├─────────────────────────────────────────────────┤
│                                    [悬浮球]      │  ← 可拖拽悬浮导航
└─────────────────────────────────────────────────┘
```

### 6.2 顶栏布局（topbar）

- **sticky 定位**，固定在视口顶部
- 左侧：品牌标识（图标 + 文字）+ 胶囊导航
- 右侧：状态 pill（在线车辆 / 今日出场 / 今日营收）+ 分隔线 + 用户下拉
- 所有子元素都是 `flex: 0 0 auto`，拒绝被挤压

### 6.3 胶囊导航（caps-nav）

- 背景 `rgba(0,0,0,0.03)` 的浅色容器，`border-radius: 999px`
- 每个按钮是 `all: unset` 的原生 `<button>`，带 `is-active` 激活态
- 激活态：白色背景 + 蓝色文字 + 阴影
- 徽章（badge）：红色圆角矩形，显示计数（如"进出厂 3"）

### 6.4 内容区过渡

```css
.page-fade-enter-active, .page-fade-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.page-fade-enter-from { opacity: 0; transform: translateY(4px); }
.page-fade-leave-to   { opacity: 0; transform: translateY(-3px); }
```

### 6.5 悬浮球导航（float-fan）

**设计初衷**：提供一个类似游戏手柄的快速导航入口，在页面底部右下角悬浮，可拖拽到任意位置。

**后来被废弃的原因**：悬浮球和顶栏胶囊提供了两套导航入口，导致用户困惑（"悬浮文字"和"上翻更多"功能定位重复）。最终决策：**只保留顶栏胶囊一种入口**，悬浮球代码保留在 MainView 中但已从路由配置中移除其导航作用。

**当前状态**：仍存在于 MainView.vue 中，但 CSS 使其不显示（因为 `float-fan` 的 toggle 按钮不触发），等待后续彻底移除。

---

## 7. 页面详解

### 7.1 登录页（LoginView.vue）

- 全屏背景图（`login-bg.jpg`），毛玻璃卡片
- 表单验证：用户名必填、密码 6 位以上
- 登录成功：写入 `localStorage` 三个字段（token / username / role），跳转 `/main/index`
- 注册对话框：用户名 + 手机号 + 密码 + 身份类型，有完整的表单校验
- 注册成功后关闭对话框，请用户前往登录

### 7.2 运营总览（IndexView.vue）

**核心页面，承载最多的数据可视化。**

- **Hero 区域**：实时 KPI（当前在场 186 / 空闲车位 2,914 / 平均时长 42min / 车位利用率 5.8%），带动态脉冲圆点
- **统计卡片网格**（6 个）：运营停车场数、车位总数、今日入场、今日出场、今日营收、平均停车时长。每个卡片可点击跳转到对应业务页面
- **面板区域**（2×2 网格）：
  - 本周车辆进出趋势图（ECharts 柱状图 + 折线图，出场/入场/营收三条数据）
  - 今日收费构成（ECharts 环形饼图，微信/支付宝/现金/月卡抵扣）
  - 实时在场车辆（最近 10 条入场记录，含车牌/类型标签/停车场/时间）
  - 各场地占用率（6 个停车场的进度条）
- **快速通道**：底部一行按钮，一键跳转各业务页面

### 7.3 停车场管理（ParkView.vue）

- 搜索 + 新增停车场 + 批量下线按钮
- 卡片网格（每行 3 张）：显示停车场名称、地址、占用率进度条、空闲/总车位、今日营收
- 卡片操作：详情列表、车位（跳转到 SlotView 并携带 parkId/parkName）、编辑、下线
- 新增/编辑对话框：名称、地址、总车位、今日营收
- 分页：6/9/12/18 条每页

### 7.4 车位总览（SlotView.vue）

**三种视图模式：**

1. **楼层平面图**（plan）：
   - 4 层 tab（A/B/C/D），每层 120 个车位（15 列 × 8 行）
   - 每个车位用彩色方块表示（绿色=空闲 / 红色=占用 / 黄色=预约 / 灰色=故障）
   - 点击车位弹出详情提示
   - 右侧图例 + 楼层汇总统计
   - 选中状态：蓝色边框高亮

2. **列表视图**（list）：
   - 表格显示所有车位（4 层合并），含车位号/楼层/类型/状态/车牌号/入场时间/剩余时长
   - 操作：开闸、修改、释放

3. **实时热力图**（heat）：
   - ECharts 热力图，横轴 24 小时，纵轴 12 个停车场
   - 颜色从浅蓝到深蓝表示占用率从低到高
   - 悬停显示具体占用率

### 7.5 车辆出入厂（EntryExitView.vue）

**入场和出场合并为一个页面，通过胶囊 tab 切换。**

- **头部**：页面标题 + 快速统计 pill（今日通行/入场/出场）
- **入场 tab**：
  - 左侧：入场登记表单（车牌/停车场/车位/类型/入场时间/操作员），带表单校验
  - 右侧：模拟摄像头画面（CSS 动画扫描线 + 车牌识别显示 + 置信度进度条）
  - 底部：今日入场记录表格
- **出场 tab**：
  - 出场车辆结算表格（车牌/停车场/车位/类型/入场时间/停车时长/应付）
  - 按车牌筛选
  - 结算按钮 + 费用明细对话框（详情描述列表 + 计费标准 + 优惠）
  - 确认结算后从列表中移除

### 7.6 收费记录（RecordView.vue）

- **筛选栏**：日期范围、停车场、车牌号、支付方式
- **统计卡片**（4 个）：总营收、平均客单价、总车次、平均停车时长
- **ECharts 图表**（2 个）：
  - 本周各时段车流热力图（24h × 7d）
  - 近 30 天营收 & 客单价趋势
- **订单表格**：50 条模拟数据，分页，支持导出 CSV（模拟）

### 7.7 用户管理（UserList.vue）

- 手机号查询 + 添加用户
- 表格：头像、用户名、密码、邮箱、联系方式
- 操作：编辑、删除、分配角色（跳转 UserAddRoles）
- 添加/编辑对话框：头像上传（Base64）、用户名、密码、邮箱、手机号
- 分页

### 7.8 角色管理（RoleList.vue）

- 角色名称查询 + 添加角色
- 表格：角色名称、备注
- 操作：编辑、删除
- 添加/编辑对话框：角色名称、备注
- 分页，API 调用有 fallback（本地 Mock 3 条数据）

### 7.9 商户管理（BusinessView.vue）

- 商户名称/手机号查询 + 新增商户
- 表格：Logo、商户名称、联系人、联系电话、地址、状态、入驻时间
- 操作：编辑、停业/开业切换、删除
- 新增/编辑对话框：Logo 上传、商户名称、联系人、联系电话、地址
- 分页

---

## 8. 样式体系

### 8.1 CSS 变量（global.css 的 :root 定义）

```css
--app-bg: #f5f6f8;              /* 页面背景 */
--app-surface: #ffffff;          /* 卡片表面 */
--app-border: #ececec;           /* 边框 */
--app-text-1: #1d1f24;          /* 主文字 */
--app-text-2: #5a6070;          /* 次要文字 */
--app-text-3: #8b909c;          /* 辅助文字 */
--app-text-4: #b8bbc3;          /* 最弱文字 */
--app-accent: #2f6fff;          /* 主题色（蓝） */
--app-accent-soft: rgba(47, 111, 255, 0.08);
--app-accent-line: rgba(47, 111, 255, 0.25);
--app-success: #2bbf8a;         /* 成功色（绿） */
--app-warn: #f0a84a;            /* 警告色（橙） */
--app-danger: #ef6464;          /* 危险色（红） */
--app-radius-lg: 16px;
--app-radius-md: 10px;
--app-radius-sm: 6px;
--app-shadow-sm: 0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.03);
--app-shadow-md: 0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04);
--app-shadow-lg: 0 10px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
--app-transition: 220ms cubic-bezier(0.22, 1, 0.36, 1);
```

### 8.2 全局样式覆盖

- 全局字体栈：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", ...`
- 自定义滚动条样式（8px 宽，圆角 thumb）
- 动画工具类：`.fade-in`（从下往上淡入）、`.glass`（毛玻璃效果）
- Element Plus 覆盖：
  - `.el-button`：统一圆角 `--app-radius-md`
  - `.el-table`：自定义表头背景、字体颜色、边框
  - `.el-dialog`：`--app-radius-lg` 圆角
  - `.el-tag`：胶囊样式
  - `.el-pagination`：主题色 hover

### 8.3 组件样式策略

- **全局通用样式**（global.css）：CSS 变量、重置、Element Plus 覆盖
- **页面级样式**：每个 `.vue` 文件使用 `<style scoped>` 或 `<style scoped lang="scss">`
- **MainView 使用 scoped 原生 CSS**：大部分样式直接写在 MainView.vue 中
- **部分页面使用 SCSS**：SlotView、ParkView、RecordView、UserList、RoleList、BusinessView 等使用 `scoped lang="scss"`，支持嵌套写法

---

## 9. 数据流与状态管理

### 9.1 数据策略

**全部使用前端 Mock 数据，无真实后端。** 这是本系统最核心的数据决策。

```
用户操作 → 组件内响应式数据更新 → 界面即时刷新
                                    ↑
                             无需等待 API 响应
```

### 9.2 数据来源

| 页面 | 数据来源 |
|------|----------|
| IndexView | 组件内硬编码 Mock 数据 + 随机生成 |
| ParkView | 组件内硬编码 12 个停车场数据 |
| SlotView | 随机生成的车位数据（每次计算重新生成） |
| EntryExitView | 组件内硬编码 + 用户提交后 unshift |
| RecordView | 组件内随机生成 50 条记录 |
| UserList | 组件内硬编码 2 条 + 用户 CRUD 操作 |
| RoleList | 先尝试 API 调用，失败后 fallback 到 3 条 Mock 数据 |
| BusinessView | 组件内硬编码 2 条 + 用户 CRUD 操作 |

### 9.3 数据持久化

- **localStorage 仅用于**：登录状态（`park_token`、`park_username`、`park_role`）
- **页面刷新数据丢失**：所有业务数据（停车场、车位、记录等）在页面刷新后重置为初始 Mock 数据

### 9.4 组件间通信

- **父子组件**：通过 props 和 emit（但本项目中几乎没有嵌套子组件，所有页面都是独立视图）
- **路由传参**：ParkView → SlotView 通过 `router.push({ query: { parkId, parkName } })`
- **全局状态**：无（未使用 Pinia/Vuex）

---

## 10. HTTP 层

### 10.1 Axios 实例（request.ts）

- baseURL: `http://localhost:7777`
- 超时: 10s
- 请求拦截器：可用于添加 token（当前未启用）
- 响应拦截器：根据 `data.code == 0` 判断成功，否则显示错误消息

### 10.2 API 接口（http/index.ts）

**users API：**
- `queryUserList(pageNo, pageSize, mobile)` → GET `/user/queryUserList`
- `deleteUser(id)` → DELETE `/user/deleteUser/{id}`
- `addUser(account, password, mail, mobile)` → POST `/user/addUser`
- `queryUserById(id)` → GET `/user/queryById`
- `updateUser(param)` → PUT `/user/updateUser`
- `queryRolesByUsersId(id)` → GET `/user/queryRolesByUsersId`
- `addUsersRole(usersId, roles)` → POST `/user/addUsersRole`

**roles API：**
- `queryList(pageNo, pageSize, roleName)` → GET `/role/queryList`
- `update(param)` → PUT `/role/edit`
- `add(param)` → POST `/role/add`
- `queryById(id)` → GET `/role/queryById`
- `deleteUser(id)` → DELETE `/role/deleteById`

### 10.3 当前状态

- 后端服务未启动，所有 API 请求会失败
- 除 RoleList 外，其他组件并未真正调用 API，而是直接操作本地 Mock 数据
- RoleList 有 try-catch fallback，请求失败时使用本地数据

---

## 11. 组件化设计

### 11.1 组件层级

```
App.vue
└── <router-view>
    ├── LoginView.vue              # 独立页面（无布局）
    └── MainView.vue               # 主布局
        └── <router-view>          # 子路由内容
            ├── IndexView.vue
            ├── ParkView.vue
            ├── SlotView.vue
            ├── EntryExitView.vue
            ├── RecordView.vue
            ├── UserList.vue
            ├── RoleList.vue
            └── BusinessView.vue
```

### 11.2 组件粒度

- 目前没有将 UI 片段抽取为独立子组件（如 `StatCard.vue`、`ParkCard.vue`）
- 原因：每个页面的卡片样式/布局有差异，提取为通用组件反而增加复杂度
- 各页面内的重复样式通过 CSS 类复用（如 `.card--lite`、`.card-title`、`.muted`）

### 11.3 自动导入

- **unplugin-vue-components**：自动注册 ElButton、ElTable 等 Element Plus 组件，无需手动 import
- **unplugin-auto-imports**：自动导入 ref、computed、onMounted 等 Vue API
- 自动导入声明文件：`components.d.ts`、`auto-imports.d.ts`

---

## 12. 构建与开发流程

### 12.1 脚本命令

```bash
npm run dev          # 启动开发服务器（Vite）
npm run build        # 类型检查 + 构建（run-p type-check build-only）
npm run build-only   # 仅构建
npm run type-check   # 仅类型检查
npm run preview      # 预览构建产物
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
```

### 12.2 构建配置

- Vite 配置（vite.config.ts）：仅使用 `@vitejs/plugin-vue` 插件和 `@` 路径别名
- TypeScript 配置：`@vue/tsconfig/tsconfig.dom.json` 扩展，`allowJs: true`

### 12.3 开发注意事项

- `npm run build` 会先执行 `vue-tsc --build --force` 类型检查，然后再执行 `vite build`
- 如果只想看构建结果，可以用 `npm run build-only`
- 类型检查通过 `tsconfig.app.json` 包含 `src/**/*` 和 `src/**/*.vue`

---

## 13. 设计演化史

### 13.1 V1 —— 初始版本

- 传统左右布局：左侧菜单栏 + 右侧内容区
- 功能：登录、停车场 CRUD、用户/角色管理
- 基于民宿管理系统的模板改造而来

### 13.2 V2 —— 游戏化 UI 重构

- 移除左侧菜单栏，改为全屏磁贴环（FAB）+ 顶栏
- 磁贴环：右下角悬浮球，点击展开 7 个导航按钮呈上半圆扇形排列
- 加入 ECharts 图表、运营总览仪表盘
- 添加车辆入场/出场/收费记录等停车场核心业务

### 13.3 V3 —— 解决遮蔽与挤压

- **问题**：磁贴环遮蔽视野 + 文字被挤压成双行/竖排
- **解决**：
  - 磁贴环保留但不再是唯一导航，顶栏添加胶囊 tab
  - 所有文字元素加 `white-space: nowrap`
  - 媒体查询处理小屏适配

### 13.4 V4 —— 统一导航入口（当前版本）

- **问题**：悬浮磁贴环和上栏 tab 功能重复，双重入口让用户困惑。用户明确指出："悬浮文字和上翻更多功能定位重复，是一部分用上栏一部分用悬浮还是只保留其中一种？"
- **解决**：
  - 彻底移除磁贴环的导航功能，**只保留顶栏胶囊 tab 一种入口**
  - 悬浮球代码保留在 MainView 中但不再使用，等待后续清理
  - 合并 EntryView 和 ExitView 到 EntryExitView，通过 tab 切换
  - 修复 el-progress format 属性未加冒号导致的组件崩溃 bug

### 13.5 设计决策的完整脉络

```
初始民宿管理系统模板
  │
  ├─ [用户要求] 改成停车场管理系统
  │
  ├─ [用户要求] "别再是一横一竖的结构了"
  │   └─ 移除左侧菜单，改为游戏化磁贴环 UI
  │
  ├─ [用户要求] 集成 ECharts 图表 + 运营总览
  │   └─ 加入 ECharts 和 IndexView 仪表盘
  │
  ├─ [用户反馈] "UI和文字之间互相遮蔽，挤压变形"
  │   └─ 加 white-space:nowrap、flex:0 0 auto、媒体查询
  │
  ├─ [用户反馈] "button 遮蔽视野，span 变为双行"
  │   ├─ 彻底移除磁贴环遮蔽源
  │   └─ 加更多响应式断点保护
  │
  ├─ [用户反馈] "悬浮文字和上翻更多功能定位重复"
  │   └─ 只保留顶栏一种入口，废弃磁贴环
  │
  └─ [用户提出] "入场和出场可以在一个页面切换"
      └─ 合并为 EntryExitView.vue
```

### 13.6 关键 Bug 修复记录

| Bug | 原因 | 修复 |
|-----|------|------|
| 磁贴环 6 个按钮挤在左上角 | 缺少动态定位计算 | 使用 JS 计算每项的 left/top，扇形排列 |
| 登录后无法跳转 | 路由守卫未放行 | LoginView 添加 localStorage.setItem('park_token') |
| 子路由不渲染 | 路由 path 用了绝对路径 | 改为相对路径 'entry-exit' 而非 '/entry-exit' |
| 控制台报错 TypeError: props.format is not a function | `format="() => ..."` 未加 v-bind 前缀 | 改为 `:format="() => ..."` |
| Transition 布局冲突 | `<transition mode="out-in">` 引起入场/出场切换时元素错位 | 移除 transition，使用 v-show 直接控制 |
| EntryExitView 页面空白 | 上述 format 错误导致组件渲染崩溃 | 同上修复 |

---

## 14. 已知问题与待办

### 14.1 技术债务

- [ ] **悬浮球代码未彻底移除**：MainView.vue 中 float-fan 相关代码（~80 行）仍在，虽然 CSS 使其不显示，应清理
- [ ] **旧页面文件未删除**：EntryView.vue、ExitView.vue 仍在 git 仓库中，路由已不再引用
- [ ] **旧项目遗留文件**：RoomList.vue（民宿房间列表）、部分 assets 图片（room.jpg、room_business.jpg 等）与本项目无关
- [ ] **MainView.script.ts**：与 MainView.vue 中的 script setup 重复，疑似重构遗留
- [ ] **base.css 未使用**：Vue 模板生成的 base.css 在 global.css 中被 import，但所有变量都被 global.css 覆盖

### 14.2 功能待办

- [ ] **折叠/展开**：总览页、收费记录页的统计区域默认只展示关键 KPI，展开后才露出图表和详细表格
- [ ] **真实数据接入**：当前全部使用 Mock 数据，接入真实后端后需要修改数据源
- [ ] **响应式完善**：部分页面（SlotView 的平面图网格）在窄屏下会溢出
- [ ] **深色模式**：当前只有浅色主题，未来可添加 `prefers-color-scheme: dark` 支持
- [ ] **国际化**：当前全部为中文，可考虑添加 i18n 支持

### 14.3 性能优化

- [ ] SlotView 的 `floorSlots` 每次切换楼层都重新生成 120 条数据，可改为缓存
- [ ] RecordView 的 `genRecords()` 每次刷新页面重新生成 50 条数据，可改为固定数据
- [ ] 图片资源（login-bg.jpg 等）可以压缩减小体积

---

*本文档最后更新：2026 年 6 月 24 日*
*作者：AI 助手（基于与用户的多轮对话整理）*