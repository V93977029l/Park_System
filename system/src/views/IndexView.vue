<template>
  <div class="dashboard">
    <el-carousel :interval="4500" arrow="always" class="carousel" height="340px">
      <el-carousel-item v-for="item in banners" :key="item.id">
        <div class="carousel-item" :style="{ backgroundImage: `url(${item.url})` }">
          <div class="carousel-mask">
            <div class="carousel-title">{{ item.title }}</div>
            <div class="carousel-sub">{{ item.sub }}</div>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <div class="stats-row">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }">
          <el-icon :size="26"><component :is="s.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span class="chart-title">本月车辆进出趋势</span>
        </template>
        <div ref="barChartRef" class="chart-box"></div>
      </el-card>
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span class="chart-title">今日收费构成</span>
        </template>
        <div ref="pieChartRef" class="chart-box"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import room5 from '../assets/room5.jpg'
import room4 from '../assets/room4.jpg'
import room3 from '../assets/room3.jpg'
import room2 from '../assets/room2.jpg'
import { OfficeBuilding, Place, CircleClose, Money } from '@element-plus/icons-vue'

const barChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let barChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const banners = [
  { id: '1', url: room5, title: '智慧停车 · 智能引导', sub: 'AI 车牌识别 · 无感支付 · 车位预定' },
  { id: '2', url: room4, title: '城市核心停车场', sub: '国贸 / 金融街 / 科技园 全面覆盖' },
  { id: '3', url: room3, title: '会员专享 · 预约车位', sub: '月卡用户尊享固定车位' },
  { id: '4', url: room2, title: '新能源 · 充电专区', sub: '扫码充电 · 充满自停 · 一键结算' }
]

const stats = [
  { label: '运营停车场', value: '12', icon: OfficeBuilding, bg: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { label: '总车位', value: '8,640', icon: Place, bg: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { label: '今日出场', value: '1,246', icon: CircleClose, bg: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { label: '今日营收', value: '¥ 48,260', icon: Money, bg: 'linear-gradient(135deg,#43e97b,#38f9d7)' }
]

const barOption: echarts.EChartsOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['入场', '出场', '营收(千元)'] },
  grid: { left: 40, right: 60, top: 40, bottom: 30 },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  },
  yAxis: [
    { type: 'value', name: '车次' },
    { type: 'value', name: '营收' }
  ],
  series: [
    {
      name: '入场', type: 'bar',
      data: [3200, 3500, 4100, 4300, 4800, 5600, 6200, 6800, 5800, 4900, 3800, 3500],
      itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] }
    },
    {
      name: '出场', type: 'bar',
      data: [3180, 3480, 4060, 4280, 4760, 5580, 6150, 6780, 5790, 4880, 3790, 3480],
      itemStyle: { color: '#E6A23C', borderRadius: [4, 4, 0, 0] }
    },
    {
      name: '营收(千元)', type: 'line', yAxisIndex: 1, smooth: true,
      data: [156, 168, 196, 208, 234, 286, 312, 346, 298, 254, 198, 182],
      itemStyle: { color: '#67C23A' },
      areaStyle: { color: 'rgba(103,194,58,0.15)' }
    }
  ]
}

const pieOption: echarts.EChartsOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      name: '收费构成', type: 'pie', radius: ['45%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n¥{c}' },
      data: [
        { value: 28600, name: '临停', itemStyle: { color: '#409EFF' } },
        { value:  9800, name: '月卡', itemStyle: { color: '#67C23A' } },
        { value:  5200, name: '充电费', itemStyle: { color: '#E6A23C' } },
        { value:  3400, name: '商户合作', itemStyle: { color: '#F56C6C' } },
        { value:  1260, name: '其他', itemStyle: { color: '#909399' } }
      ]
    }
  ]
}

const resize = () => {
  barChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value)
    barChart.setOption(barOption)
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption(pieOption)
  }
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  barChart?.dispose()
  pieChart?.dispose()
})
</script>

<style scoped lang="scss">
.dashboard { display: flex; flex-direction: column; gap: 18px; }

.carousel { border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.carousel-item {
  width: 100%; height: 100%;
  background-size: cover; background-position: center; position: relative;
}
.carousel-mask {
  position: absolute; left: 0; bottom: 0; right: 0;
  padding: 22px 30px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
  color: #fff;
}
.carousel-title { font-size: 26px; font-weight: 600; letter-spacing: 1px; text-shadow: 0 2px 6px rgba(0,0,0,0.4); }
.carousel-sub { margin-top: 8px; font-size: 14px; opacity: 0.9; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card {
  background: #fff; border-radius: 10px; padding: 20px 22px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,0.1); }
}
.stat-icon {
  width: 54px; height: 54px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.stat-value { font-size: 22px; font-weight: 600; color: #303133; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }

.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.chart-card {
  border-radius: 10px;
  :deep(.el-card__header) { padding: 12px 20px; border-bottom: 1px solid #ebeef5; }
}
.chart-title { font-size: 15px; font-weight: 600; color: #303133; }
.chart-box { height: 320px; width: 100%; }
</style>
