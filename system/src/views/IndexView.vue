<template>
  <div class="workbench">
    <section class="hero">
      <div class="hero-left">
        <div class="hero-title">智慧停车场指挥中心 · 运营态势总览</div>
        <div class="hero-sub">实时车流 · 智能引导 · 无感支付</div>
      </div>
      <div class="hero-right">
        <div class="hero-stat" v-for="s in heroStats" :key="s.label">
          <div class="hero-stat-value">
            <span v-if="s.symbol" class="hero-symbol">{{ s.symbol }}</span>{{ s.value }}
          </div>
          <div class="hero-stat-label">{{ s.label }}</div>
        </div>
      </div>
      <div class="hero-foot">
        <span class="hero-foot-item">{{ now }}</span>
        <span class="hero-foot-divider">|</span>
        <span class="hero-foot-item">晴 {{ 22 }}℃ · 微风 2级</span>
      </div>
    </section>

    <el-row :gutter="12" class="kpi-row">
      <el-col :span="4" v-for="k in kpis" :key="k.label">
        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-inner">
            <div class="kpi-icon" :style="{ background: k.bg, color: k.color }">
              <el-icon :size="26"><component :is="iconMap[k.icon]" /></el-icon>
            </div>
            <div class="kpi-body">
              <div class="kpi-value">
                <span v-if="k.symbol" class="kpi-symbol">{{ k.symbol }}</span>{{ k.value }}
              </div>
              <div class="kpi-label">{{ k.label }}</div>
              <div class="kpi-trend" :class="k.trendUp ? 'up' : 'down'">
                <el-icon><component :is="k.trendUp ? 'Top' : 'Bottom'" /></el-icon>
                比昨日 {{ k.trend }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <section class="section">
      <div class="section-title">停车场实时总览</div>
      <div class="parks-grid">
        <div class="park-card" v-for="p in parks" :key="p.id">
          <div class="park-gauge">
            <div class="park-mini" :id="'gauge-' + p.id"></div>
          </div>
          <div class="park-info">
            <div class="park-name">{{ p.name }}</div>
            <div class="park-sub">
              <span class="park-sub-item" :class="p.todayIn - p.todayOut >= 0 ? 'up' : 'down'">
                今日车流 {{ p.todayIn - p.todayOut >= 0 ? '+' : '' }}{{ p.todayIn - p.todayOut }}
              </span>
            </div>
            <div class="park-sub">
              <span class="park-sub-item">当前车位 {{ p.free }} / {{ p.total }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="events-bar">
        <div class="events-scroll" :style="{ animationDuration: events.length * 2 + 's' }">
          <div class="events-track" ref="eventsTrack">
            <span class="event" v-for="(e, idx) in eventsLoop" :key="idx">
              <span class="event-dot" :class="'dot-' + e.type"></span>
              <span class="event-time">{{ e.time }}</span>
              <span class="event-text" :class="'text-' + e.type">{{ e.text }}</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <el-row :gutter="12" class="charts-row">
      <el-col :span="14">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span class="chart-title">12月车流&营收趋势</span>
          </template>
          <div ref="trendChartRef" style="width:100%; height:320px"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span class="chart-title">今日收费构成</span>
          </template>
          <div ref="pieChartRef" style="width:100%; height:320px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  CircleCheck, Warning, CircleClose, Van, Monitor, Coin, DataLine,
  Lightning, OfficeBuilding, Opportunity, Timer, TrendCharts, ScaleToOriginal, Tickets
} from '@element-plus/icons-vue'

const iconMap: { [k: string]: any } = {
  Van,
  Monitor,
  Coin,
  DataLine,
  Lightning,
  OfficeBuilding,
  Opportunity,
  Timer,
  TrendCharts,
  ScaleToOriginal,
  Tickets,
  CircleCheck,
  Warning,
  CircleClose,
  Top: 'Top',
  Bottom: 'Bottom'
}

const heroStats = [
  { label: '今日入场', value: '1,658', symbol: '' },
  { label: '今日出场', value: '1,534', symbol: '' },
  { label: '今日营收', value: '68,200', symbol: '¥' }
]

const kpis = [
  { label: '运营停车场', value: '12', icon: 'OfficeBuilding', bg: '#ecf5ff', color: '#409EFF', trend: '+3.2%', trendUp: true, symbol: '' },
  { label: '总车位', value: '3,600', icon: 'Opportunity', bg: '#f0f9eb', color: '#67C23A', trend: '+1.5%', trendUp: true, symbol: '' },
  { label: '在库车辆', value: '2,486', icon: 'Van', bg: '#fdf6ec', color: '#E6A23C', trend: '+5.8%', trendUp: true, symbol: '' },
  { label: '今日车流', value: '3,192', icon: 'TrendCharts', bg: '#e6fffb', color: '#06b6d4', trend: '+2.1%', trendUp: true, symbol: '' },
  { label: '今日营收', value: '68,200', icon: 'Coin', bg: '#fff3e0', color: '#f97316', trend: '+8.6%', trendUp: true, symbol: '¥' },
  { label: '在线率', value: '98.5%', icon: 'Monitor', bg: '#f3e8ff', color: '#a855f7', trend: '-0.2%', trendUp: false, symbol: '' }
]

const parks = [
  { id: '1', name: '国贸', rate: 62, free: 120, total: 320, todayIn: 826, todayOut: 803, trend: '+23' },
  { id: '2', name: '金融街', rate: 88, free: 24, total: 200, todayIn: 512, todayOut: 527, trend: '-15' },
  { id: '3', name: '科技园', rate: 55, free: 160, total: 360, todayIn: 408, todayOut: 399, trend: '+9' },
  { id: '4', name: '万象城', rate: 78, free: 76, total: 350, todayIn: 621, todayOut: 605, trend: '+16' },
  { id: '5', name: '高铁站', rate: 45, free: 260, total: 470, todayIn: 712, todayOut: 690, trend: '+22' },
  { id: '6', name: '机场T3', rate: 68, free: 210, total: 660, todayIn: 915, todayOut: 880, trend: '+35' },
  { id: '7', name: '万达广场', rate: 72, free: 112, total: 400, todayIn: 550, todayOut: 541, trend: '+9' },
  { id: '8', name: '人民广场', rate: 95, free: 15, total: 300, todayIn: 421, todayOut: 433, trend: '-12' },
  { id: '9', name: '奥体中心', rate: 38, free: 285, total: 460, todayIn: 218, todayOut: 210, trend: '+8' },
  { id: '10', name: '软件园', rate: 82, free: 66, total: 360, todayIn: 396, todayOut: 382, trend: '+14' },
  { id: '11', name: '大学城', rate: 52, free: 184, total: 380, todayIn: 352, todayOut: 346, trend: '+6' },
  { id: '12', name: '会展中心', rate: 75, free: 98, total: 390, todayIn: 618, todayOut: 602, trend: '+16' }
]

const events = [
  { time: '15:32', type: 'in', text: '国贸 A层 车牌 京A·88xxx 已入场 [车牌识别]' },
  { time: '15:30', type: 'warn', text: '金融街 B层 车位 B-012 传感器离线' },
  { time: '15:28', type: 'in', text: '科技园 C层 车牌 沪B·66xxx 已出场 [无感支付] ¥18' },
  { time: '15:26', type: 'err', text: '万象城 A层 闸机 3号 异常 [已告警]' },
  { time: '15:24', type: 'in', text: '高铁站 负一 车牌 粤A·12xxx 已入场 [车牌识别]' },
  { time: '15:22', type: 'in', text: '机场T3 东 车牌 浙C·55xxx 已出场 [无感支付] ¥42' },
  { time: '15:20', type: 'warn', text: '万达广场 A层 余位 < 10 [预警]' },
  { time: '15:18', type: 'in', text: '人民广场 B层 车牌 苏A·23xxx 已入场 [车牌识别]' },
  { time: '15:16', type: 'in', text: '奥体中心 主 车牌 京C·77xxx 已出场 [无感支付] ¥12' },
  { time: '15:14', type: 'err', text: '软件园 B层 摄像头 离线 [已告警]' },
  { time: '15:12', type: 'in', text: '大学城 北 车牌 鄂A·90xxx 已入场 [车牌识别]' },
  { time: '15:10', type: 'warn', text: '会展中心 东 充电枪 8号 过载 [已处理]' },
  { time: '15:08', type: 'in', text: '国贸 A层 车牌 京A·34xxx 已出场 [无感支付] ¥28' },
  { time: '15:06', type: 'in', text: '金融街 B层 车牌 沪A·11xxx 已入场 [车牌识别]' },
  { time: '15:04', type: 'in', text: '科技园 C层 车牌 粤B·45xxx 已入场 [车牌识别]' }
]

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const trafficIn = [3200, 3500, 4100, 4300, 4800, 5600, 6200, 6800, 5800, 4900, 3800, 3500]
const trafficOut = [3180, 3480, 4060, 4280, 4760, 5580, 6150, 6780, 5790, 4880, 3790, 3480]
const revenue = [156, 168, 196, 208, 234, 286, 312, 346, 298, 254, 198, 182]

const chargePie = [
  { value: 28600, name: '临停', itemStyle: { color: '#409EFF' } },
  { value: 19800, name: '月卡', itemStyle: { color: '#67C23A' } },
  { value: 8200, name: '充电', itemStyle: { color: '#E6A23C' } },
  { value: 5600, name: '商户', itemStyle: { color: '#F56C6C' } },
  { value: 6000, name: '其他', itemStyle: { color: '#909399' } }
]

const trendChartRef = ref<any>(null)
const pieChartRef = ref<any>(null)
const eventsTrack = ref<any>(null)

let trendChart: any = null
let pieChart: any = null
const gaugeCharts: any[] = []

const eventsLoop = computed(() => [...events, ...events])

const now = reactive({ value: '' })
const updateClock = () => {
  const d = new Date()
  const pad = (n: number) => (n < 10 ? '0' + n : n)
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  now.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${w}`
}
let timer: any = null

const rateColor = (r: number) => (r < 70 ? '#67C23A' : r < 90 ? '#E6A23C' : '#F56C6C')

const initGauge = (p: any) => {
  const el = document.getElementById('gauge-' + p.id)
  if (!el) return
  const g = echarts.init(el)
  gaugeCharts.push(g)
  g.setOption({
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        center: ['50%', '55%'],
        radius: '90%',
        min: 0,
        max: 100,
        splitNumber: 10,
        progress: { show: true, width: 10, itemStyle: { color: rateColor(p.rate) } },
        axisLine: { lineStyle: { width: 10, color: [[1, '#eef0f3']] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: false },
        detail: {
          offsetCenter: [0, '5%'],
          formatter: p.rate + '%',
          fontSize: 14,
          fontWeight: 700,
          color: rateColor(p.rate)
        },
        data: [{ value: p.rate }]
      }
    ]
  })
}

const trendOption: any = {
  title: { left: 'center', text: '12月车流 & 营收趋势', textStyle: { fontSize: 14, color: '#303133' } },
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { top: 28, data: ['入场', '出场', '营收(千元)'] },
  grid: { left: 40, right: 50, top: 70, bottom: 30 },
  xAxis: { type: 'category', data: months, axisTick: { alignWithLabel: true } },
  yAxis: [
    { type: 'value', name: '车次', splitLine: { lineStyle: { type: 'dashed' } } },
    { type: 'value', name: '营收(千元)', splitLine: { show: false } }
  ],
  series: [
    {
      name: '入场', type: 'bar', stack: 'traffic',
      data: trafficIn, itemStyle: { color: '#409EFF', borderRadius: [0, 0, 0, 0] }, barWidth: 14
    },
    {
      name: '出场', type: 'bar', stack: 'traffic',
      data: trafficOut, itemStyle: { color: '#67C23A' }, barWidth: 14
    },
    {
      name: '营收(千元)', type: 'line', yAxisIndex: 1, smooth: true,
      data: revenue, itemStyle: { color: '#F97316' },
      areaStyle: { color: 'rgba(249,115,22,0.15)' },
      symbol: 'circle', symbolSize: 6
    }
  ]
}

const pieOption: any = {
  title: { left: 'center', text: '今日收费构成', textStyle: { fontSize: 14, color: '#303133' } },
  tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
  legend: { bottom: 0, type: 'scroll' },
  series: [
    {
      name: '收费构成',
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['50%', '48%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n¥{c}', fontSize: 12 },
      labelLine: { length: 8, length2: 8 },
      data: chargePie
    }
  ]
}

const onRes = () => {
  trendChart?.resize()
  pieChart?.resize()
  gaugeCharts.forEach((g) => g && g.resize())
}

onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 1000)

  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption(trendOption)
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption(pieOption)
  }
  parks.forEach((p) => initGauge(p))

  window.addEventListener('resize', onRes)

  ElMessage.success('智慧停车场工作台已就绪')
})

onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('resize', onRes)
  trendChart?.dispose()
  pieChart?.dispose()
  gaugeCharts.forEach((g) => g && g.dispose())
})
</script>

<style scoped lang="scss">
.workbench { display: flex; flex-direction: column; gap: 14px; padding: 14px; background: #f4f6fa; min-height: 100vh; box-sizing: border-box; }

.hero {
  position: relative;
  border-radius: 10px;
  padding: 22px 28px 42px 28px;
  color: #fff;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4e54c8 100%);
  box-shadow: 0 4px 20px rgba(46, 82, 182, 0.25);
  overflow: hidden;
  &::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle at 85% 20%, rgba(255,255,255,0.15) 0, transparent 40%),
                radial-gradient(circle at 10% 80%, rgba(255,255,255,0.1) 0, transparent 40%);
    pointer-events: none;
  }
}
.hero-left { position: relative; z-index: 1; }
.hero-title { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
.hero-sub { margin-top: 6px; font-size: 14px; opacity: 0.85; }

.hero-right {
  position: absolute; top: 22px; right: 28px;
  display: flex; gap: 28px;
  z-index: 1;
}
.hero-stat { text-align: right; }
.hero-stat-value { font-size: 28px; font-weight: 700; letter-spacing: 1px; }
.hero-symbol { font-size: 18px; margin-right: 2px; }
.hero-stat-label { font-size: 12px; opacity: 0.85; margin-top: 2px; }

.hero-foot {
  position: absolute; bottom: 10px; left: 28px;
  display: flex; gap: 10px; font-size: 12px; opacity: 0.9;
  z-index: 1;
}
.hero-foot-divider { opacity: 0.5; }

.kpi-row { margin-top: 4px; }
.kpi-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  border: none;
  :deep(.el-card__body) { padding: 14px 16px; }
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12); }
}
.kpi-inner { display: flex; align-items: center; gap: 12px; }
.kpi-icon {
  width: 46px; height: 46px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-body { flex: 1; }
.kpi-value { font-size: 22px; font-weight: 700; color: #303133; line-height: 1.2; }
.kpi-symbol { font-size: 14px; margin-right: 2px; }
.kpi-label { font-size: 12px; color: #909399; margin-top: 2px; }
.kpi-trend { font-size: 11px; margin-top: 3px; display: inline-flex; align-items: center; gap: 2px; }
.kpi-trend.up { color: #67C23A; }
.kpi-trend.down { color: #F56C6C; }

.section {
  background: #fff;
  border-radius: 8px;
  padding: 16px 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.section-title { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 12px; padding-left: 10px; border-left: 3px solid #409EFF; }

.parks-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.park-card {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
}
.park-gauge { width: 56px; height: 56px; flex-shrink: 0; }
.park-mini { width: 100%; height: 100%; }
.park-info { flex: 1; min-width: 0; }
.park-name { font-size: 13px; font-weight: 600; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.park-sub { margin-top: 2px; font-size: 11px; color: #909399; }
.park-sub .up { color: #67C23A; }
.park-sub .down { color: #F56C6C; }

.events-bar {
  margin-top: 14px;
  border-top: 1px dashed #ebeef5;
  padding-top: 12px;
  overflow: hidden;
  white-space: nowrap;
}
.events-scroll {
  overflow: hidden;
}
.events-track {
  display: inline-block;
  padding-left: 100%;
  animation: marquee linear infinite;
  white-space: nowrap;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.event {
  display: inline-flex; align-items: center; gap: 6px;
  margin-right: 40px;
  font-size: 12px;
}
.event-dot {
  display: inline-block;
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.dot-in { background: #67C23A; box-shadow: 0 0 6px rgba(103,194,58,0.7); }
.dot-warn { background: #E6A23C; box-shadow: 0 0 6px rgba(230,162,60,0.7); }
.dot-err { background: #F56C6C; box-shadow: 0 0 6px rgba(245,108,108,0.7); }
.event-time { color: #909399; font-family: Consolas, monospace; }
.text-in { color: #303133; }
.text-warn { color: #E6A23C; }
.text-err { color: #F56C6C; }

.charts-row { margin-top: 2px; }
.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: none;
  :deep(.el-card__header) { padding: 12px 18px; border-bottom: 1px solid #ebeef5; }
}
.chart-title { font-size: 14px; font-weight: 600; color: #303133; }
</style>
