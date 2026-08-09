<template>
  <div class="cockpit">
    <div class="hero">
      <div class="hero__bg"/>
      <div class="hero__inner">
        <div class="hero__copy">
          <div class="hero__eyebrow">LIVE DASHBOARD · {{ todayLabel }}</div>
          <h2 class="hero__title">6 座停车场 · 3,200 泊位</h2>
          <p class="hero__desc">实时总览各场地利用率与车流走势，支持一键直达核心业务界面。</p>
        </div>
        <div class="hero__live">
          <div class="hero__live-head">
            <span class="hero__live-dot"/>
            <span class="hero__live-label">实时</span>
          </div>
          <div class="hero__live-grid">
            <div class="hero__live-cell">
              <div class="hero__live-k">当前在场</div>
              <div class="hero__live-v">186</div>
              <div class="hero__live-chg hero__live-chg--up">+12</div>
            </div>
            <div class="hero__live-cell">
              <div class="hero__live-k">空闲车位</div>
              <div class="hero__live-v">2,914</div>
              <div class="hero__live-chg hero__live-chg--down">-4</div>
            </div>
            <div class="hero__live-cell">
              <div class="hero__live-k">平均时长</div>
              <div class="hero__live-v">42<span class="hero__live-unit">min</span></div>
              <div class="hero__live-chg">≈ 持平</div>
            </div>
            <div class="hero__live-cell">
              <div class="hero__live-k">车位利用率</div>
              <div class="hero__live-v">5.8<span class="hero__live-unit">%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div
        v-for="s in stats"
        :key="s.title"
        class="stat-card"
        @click="s.path && router.push(s.path)"
        :class="{ 'stat-card--link': !!s.path }"
      >
        <div class="stat-card__head">
          <div class="stat-card__label">
            <span>{{ s.title }}</span>
            <el-icon v-if="s.path" class="stat-card__goto"><ArrowRight /></el-icon>
          </div>
          <el-icon class="stat-card__ico" :style="{ background: s.soft, color: s.color }">
            <component :is="s.icon" />
          </el-icon>
        </div>
        <div class="stat-card__value">{{ s.value }}</div>
        <div class="stat-card__sub">
          <span class="stat-card__tag" :class="s.tagType">{{ s.tag }}</span>
          <span>{{ s.sub }}</span>
        </div>
      </div>
    </div>

    <div class="panels">
      <div class="panel panel--lg">
        <div class="panel__head">
          <div class="panel__title">
            <span class="panel__dot"/>
            <span>本周车辆进出趋势</span>
          </div>
          <div class="panel__legend">
            <span><i style="background:var(--app-accent)"/>出场</span>
            <span><i style="background:#b8bdd0"/>入场</span>
            <span><i style="background:#2bbf8a"/>营收(千)</span>
          </div>
        </div>
        <div ref="trendRef" class="panel__chart"/>
      </div>

      <div class="panel panel--sm">
        <div class="panel__head">
          <div class="panel__title">
            <span class="panel__dot"/>
            <span>今日收费构成</span>
          </div>
        </div>
        <div ref="pieRef" class="panel__chart panel__chart--pie"/>
      </div>

      <div class="panel panel--lg">
        <div class="panel__head">
          <div class="panel__title">
            <span class="panel__dot"/>
            <span>实时在场车辆</span>
            <span class="panel__title-sub">· 最近 10 条入场</span>
          </div>
          <el-button link type="primary" @click="router.push('/main/entry')">
            全部入口 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="live-rows">
          <div v-for="row in liveRows" :key="row.plate" class="live-row">
            <div class="live-row__plate">{{ row.plate }}</div>
            <div class="live-row__pill" :class="row.pill">{{ row.tag }}</div>
            <div class="live-row__park">{{ row.park }}</div>
            <div class="live-row__time">{{ row.time }}</div>
          </div>
        </div>
      </div>

      <div class="panel panel--sm">
        <div class="panel__head">
          <div class="panel__title">
            <span class="panel__dot"/>
            <span>各场地占用</span>
          </div>
        </div>
        <div class="park-bars">
          <div v-for="p in parkBars" :key="p.name" class="park-bar">
            <div class="park-bar__label">
              <span class="park-bar__name">{{ p.name }}</span>
              <span class="park-bar__nums">{{ p.used }}/{{ p.total }}</span>
            </div>
            <div class="park-bar__track">
              <div class="park-bar__fill" :style="{ width: p.pct + '%', background: p.color }"/>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-bar">
      <div class="quick-bar__tip">快速通道</div>
      <div class="quick-bar__items">
        <button v-for="q in quick" :key="q.path" class="quick-bar__btn" @click="router.push(q.path)">
          <el-icon class="quick-bar__ico" :style="{ background: q.soft, color: q.color }"><component :is="q.icon"/></el-icon>
          <span>{{ q.label }}</span>
          <el-icon class="quick-bar__arrow"><ArrowRight /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, h } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  ArrowRight, Location, ScaleToOriginal, Tickets, Grid, OfficeBuilding, Timer, Wallet, Coin
} from '@element-plus/icons-vue'

const router = useRouter()
const trendRef = ref<HTMLElement>()
const pieRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const todayLabel = (() => {
  const d = new Date()
  const w = ['日','一','二','三','四','五','六'][d.getDay()]
  return `${d.getMonth()+1}月${d.getDate()}日 · 周${w}`
})()

const stats = [
  { title: '运营停车场', value: '6', sub: '较昨日 +1', tag: '+17%', tagType: 'up', icon: OfficeBuilding, color: '#2f6fff', soft: 'rgba(47,111,255,0.08)', path: '/main/parks' },
  { title: '车位总数', value: '3,200', sub: '标准+充电+VIP', tag: '稳定', tagType: 'flat', icon: Grid, color: '#6f5cff', soft: 'rgba(111,92,255,0.08)', path: '/main/slots' },
  { title: '今日入场', value: '85', sub: '实时数据', tag: '+8', tagType: 'up', icon: Location, color: '#2bbf8a', soft: 'rgba(43,191,138,0.08)', path: '/main/entry' },
  { title: '今日出场', value: '73', sub: '已放行', tag: '+5', tagType: 'up', icon: ScaleToOriginal, color: '#f0a84a', soft: 'rgba(240,168,74,0.08)', path: '/main/exit' },
  { title: '今日营收', value: '¥28,460', sub: '现金/微信/支付宝/月卡', tag: '+12.4%', tagType: 'up', icon: Wallet, color: '#2f6fff', soft: 'rgba(47,111,255,0.08)', path: '/main/records' },
  { title: '平均停车时长', value: '42 min', sub: '环比 -3 min', tag: '持平', tagType: 'flat', icon: Timer, color: '#8b909c', soft: 'rgba(139,144,156,0.08)' }
]

const quick = [
  { label: '车辆入场', path: '/main/entry', icon: Location, color: '#2bbf8a', soft: 'rgba(43,191,138,0.08)' },
  { label: '车辆出场', path: '/main/exit', icon: ScaleToOriginal, color: '#f0a84a', soft: 'rgba(240,168,74,0.08)' },
  { label: '收费记录', path: '/main/records', icon: Tickets, color: '#2f6fff', soft: 'rgba(47,111,255,0.08)' },
  { label: '停车场', path: '/main/parks', icon: OfficeBuilding, color: '#6f5cff', soft: 'rgba(111,92,255,0.08)' },
  { label: '车位总览', path: '/main/slots', icon: Grid, color: '#8b909c', soft: 'rgba(139,144,156,0.08)' }
]

const liveRows = [
  { plate: '京B·A8888', tag: 'VIP', pill: 'pill--vip', park: '主楼P1', time: '10:32 入场' },
  { plate: '沪A·66V3K', tag: '月卡', pill: 'pill--month', park: '东广场P2', time: '10:28 入场' },
  { plate: '粤B·8F21D', tag: '临时', pill: 'pill--temp', park: '地下B1', time: '10:21 入场' },
  { plate: '苏E·77H8L', tag: '临时', pill: 'pill--temp', park: '主楼P1', time: '10:15 入场' },
  { plate: '浙A·33Q9M', tag: '充电', pill: 'pill--ev', park: '西充电区', time: '10:10 入场' },
  { plate: '京A·8888W', tag: 'VIP', pill: 'pill--vip', park: '主楼P1', time: '09:58 入场' },
  { plate: '沪B·22D6T', tag: '月卡', pill: 'pill--month', park: '东广场P2', time: '09:52 入场' },
  { plate: '粤A·55H2C', tag: '临时', pill: 'pill--temp', park: '地下B2', time: '09:43 入场' },
  { plate: '京G·9K91M', tag: '充电', pill: 'pill--ev', park: '西充电区', time: '09:36 入场' },
  { plate: '沪C·3R22Q', tag: '月卡', pill: 'pill--month', park: '地下B1', time: '09:20 入场' }
]

const parkBars = [
  { name: '主楼P1', used: 78, total: 500, pct: 15.6, color: '#2f6fff' },
  { name: '东广场P2', used: 42, total: 320, pct: 13.1, color: '#6f5cff' },
  { name: '地下B1', used: 34, total: 800, pct: 4.3,  color: '#2bbf8a' },
  { name: '地下B2', used: 18, total: 800, pct: 2.3,  color: '#f0a84a' },
  { name: '西充电区', used: 12, total: 180, pct: 6.7,  color: '#2f6fff' },
  { name: 'VIP专属', used: 2, total: 200, pct: 1.0,  color: '#8b909c' }
]

const initTrend = () => {
  if (!trendRef.value) return
  trendChart = echarts.init(trendRef.value)
  const days = ['周一','周二','周三','周四','周五','周六','周日']
  trendChart.setOption({
    grid: { left: 44, right: 24, top: 32, bottom: 36 },
    tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#ececec', textStyle: { color: '#1d1f24', fontSize: 12 } },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#8b909c', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f1f4', type: 'dashed' } },
      axisLabel: { color: '#8b909c', fontSize: 11 }
    },
    series: [
      {
        name: '出场',
        type: 'bar',
        barWidth: 10,
        barGap: '10%',
        itemStyle: {
          borderRadius: [5,5,0,0],
          color: new echarts.graphic.LinearGradient(0,0,0,1,[
            { offset: 0, color: '#2f6fff' },
            { offset: 1, color: '#6aa3ff' }
          ])
        },
        data: [62, 54, 71, 68, 82, 96, 73]
      },
      {
        name: '入场',
        type: 'bar',
        barWidth: 10,
        itemStyle: {
          borderRadius: [5,5,0,0],
          color: '#dfe2ea'
        },
        data: [71, 60, 80, 76, 90, 105, 85]
      },
      {
        name: '营收(千)',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#2bbf8a', width: 2 },
        itemStyle: { color: '#2bbf8a', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0,0,0,1,[
            { offset: 0, color: 'rgba(43,191,138,0.22)' },
            { offset: 1, color: 'rgba(43,191,138,0)' }
          ])
        },
        data: [21, 18, 24, 23, 27, 33, 28]
      }
    ]
  })
}

const initPie = () => {
  if (!pieRef.value) return
  pieChart = echarts.init(pieRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', backgroundColor: '#fff', borderColor: '#ececec', textStyle: { color: '#1d1f24', fontSize: 12 } },
    legend: {
      show: true,
      bottom: 4,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#5a6070', fontSize: 11 }
    },
    series: [{
      type: 'pie',
      radius: ['56%', '80%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      labelLine: { show: false },
      data: [
        { name: '微信支付', value: 10420, itemStyle: { color: '#2bbf8a' } },
        { name: '支付宝', value:  8670, itemStyle: { color: '#2f6fff' } },
        { name: '现金',    value:  4230, itemStyle: { color: '#f0a84a' } },
        { name: '月卡抵扣', value:  5140, itemStyle: { color: '#6f5cff' } }
      ]
    }]
  })
}

const onResize = () => {
  trendChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  setTimeout(() => { initTrend(); initPie() }, 60)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  trendChart?.dispose()
  pieChart?.dispose()
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.cockpit {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-sm);
}
.hero__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 320px at 85% -10%, rgba(47,111,255,0.14), transparent 60%),
    radial-gradient(800px 260px at -10% 110%, rgba(111,92,255,0.09), transparent 60%);
  pointer-events: none;
}
.hero__inner {
  position: relative;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.hero__copy { max-width: 42%; }
.hero__eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--app-text-3);
  margin-bottom: 10px;
}
.hero__title {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--app-text-1);
}
.hero__desc {
  margin: 0;
  color: var(--app-text-2);
  font-size: 13px;
  line-height: 1.7;
}
.hero__live {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(14px);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 18px 22px;
  min-width: 380px;
}
.hero__live-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.hero__live-dot {
  width: 8px; height: 8px; border-radius: 999px;
  background: var(--app-success);
  box-shadow: 0 0 0 4px rgba(43,191,138,0.18);
  animation: livePulse 2s ease-in-out infinite;
}
.hero__live-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--app-text-2);
}
.hero__live-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 22px;
}
.hero__live-cell { line-height: 1.15; }
.hero__live-k {
  font-size: 11px;
  color: var(--app-text-3);
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}
.hero__live-v {
  font-size: 22px;
  font-weight: 700;
  color: var(--app-text-1);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.hero__live-unit {
  font-size: 11px;
  font-weight: 500;
  color: var(--app-text-3);
  margin-left: 3px;
}
.hero__live-chg {
  font-size: 11px;
  color: var(--app-text-3);
  margin-top: 2px;
}
.hero__live-chg--up   { color: var(--app-success); font-weight: 600; }
.hero__live-chg--down { color: var(--app-danger);  font-weight: 600; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}
@media (max-width: 1400px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

.stat-card {
  background: #fff;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: var(--app-shadow-sm);
  transition: transform var(--app-transition), border-color var(--app-transition), box-shadow var(--app-transition);
}
.stat-card--link { cursor: pointer; }
.stat-card--link:hover {
  transform: translateY(-2px);
  border-color: var(--app-accent-line);
  box-shadow: var(--app-shadow-md);
}
.stat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.stat-card__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-2);
  display: inline-flex; align-items: center; gap: 6px;
}
.stat-card__goto { font-size: 12px; color: var(--app-text-4); }
.stat-card__ico {
  width: 32px; height: 32px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
}
.stat-card__value {
  font-size: 22px;
  font-weight: 700;
  color: var(--app-text-1);
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  margin-bottom: 8px;
}
.stat-card__sub {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--app-text-3);
}
.stat-card__tag {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.stat-card__tag--up   { background: rgba(43,191,138,0.1);  color: var(--app-success); }
.stat-card__tag--down { background: rgba(239,100,100,0.1);  color: var(--app-danger); }
.stat-card__tag--flat { background: rgba(139,144,156,0.1); color: var(--app-text-3); }

.panels {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  grid-auto-rows: auto;
  gap: 16px;
}
.panel {
  background: #fff;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: var(--app-shadow-sm);
  display: flex; flex-direction: column;
  min-width: 0;
}
.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.panel__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--app-text-1);
}
.panel__title-sub {
  font-size: 11px;
  font-weight: 500;
  color: var(--app-text-3);
}
.panel__dot {
  width: 6px; height: 6px; border-radius: 999px;
  background: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}
.panel__legend {
  display: inline-flex; gap: 14px;
  font-size: 11px; color: var(--app-text-3);
}
.panel__legend span { display: inline-flex; align-items: center; gap: 6px; }
.panel__legend i {
  width: 8px; height: 8px; border-radius: 999px;
  display: inline-block;
}
.panel__chart { height: 260px; width: 100%; flex: 1; min-height: 220px; }
.panel__chart--pie { height: 260px; }

.panel--lg:nth-child(3) { grid-column: 1 / 2; }
.panel--sm:nth-child(4) { grid-column: 2 / 3; }

@media (max-width: 1100px) {
  .panels { grid-template-columns: 1fr; }
}

.live-rows {
  display: flex; flex-direction: column;
  gap: 2px;
  max-height: 320px; overflow: auto;
}
.live-row {
  display: grid;
  grid-template-columns: 130px 74px 1fr 110px;
  align-items: center;
  gap: 14px;
  padding: 10px 2px;
  border-bottom: 1px dashed var(--app-border);
  font-size: 12.5px;
}
.live-row:last-child { border-bottom: none; }
.live-row__plate {
  font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
  font-weight: 600;
  color: var(--app-text-1);
  letter-spacing: 0.02em;
}
.live-row__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 10.5px;
  font-weight: 600;
}
.pill--vip    { background: rgba(47,111,255,0.08);  color: var(--app-accent); }
.pill--month  { background: rgba(111,92,255,0.1);  color: #6f5cff; }
.pill--temp   { background: rgba(240,168,74,0.12); color: var(--app-warn); }
.pill--ev     { background: rgba(43,191,138,0.1);  color: var(--app-success); }
.live-row__park { color: var(--app-text-2); }
.live-row__time { color: var(--app-text-3); font-size: 11.5px; font-variant-numeric: tabular-nums; }

.park-bars { display: flex; flex-direction: column; gap: 14px; }
.park-bar__label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.park-bar__name { font-size: 12px; font-weight: 600; color: var(--app-text-1); }
.park-bar__nums { font-size: 11px; color: var(--app-text-3); font-variant-numeric: tabular-nums; }
.park-bar__track {
  width: 100%;
  height: 6px;
  background: #f1f2f5;
  border-radius: 999px;
  overflow: hidden;
}
.park-bar__fill {
  height: 100%;
  border-radius: 999px;
  transition: width var(--app-transition);
}

.quick-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: #fff;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  box-shadow: var(--app-shadow-sm);
}
.quick-bar__tip {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--app-text-3);
  padding: 0 10px;
  border-right: 1px dashed var(--app-border-strong);
  margin-right: 4px;
}
.quick-bar__items {
  display: flex; flex-wrap: wrap; gap: 10px; flex: 1;
}
.quick-bar__btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 14px 0 8px;
  border-radius: 999px;
  background: #fafbfc;
  border: 1px solid var(--app-border);
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-1);
  transition: transform var(--app-transition), border-color var(--app-transition), background var(--app-transition);
}
.quick-bar__btn:hover {
  transform: translateY(-1px);
  background: #fff;
  border-color: var(--app-accent-line);
}
.quick-bar__ico {
  width: 22px; height: 22px;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
}
.quick-bar__arrow {
  font-size: 12px;
  color: var(--app-text-4);
  margin-left: 2px;
}
</style>
