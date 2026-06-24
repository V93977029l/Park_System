<template>
  <div class="page">
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-date-picker v-model="range" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" value-format="YYYY-MM-DD" />
        <el-select v-model="parkFilter" placeholder="全部停车场" clearable style="width: 200px">
          <el-option v-for="p in parks" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-input v-model="plate" placeholder="车牌号" clearable style="width: 180px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="payFilter" placeholder="全部支付方式" clearable style="width: 160px">
          <el-option label="无感支付" value="无感支付" />
          <el-option label="微信" value="微信" />
          <el-option label="支付宝" value="支付宝" />
          <el-option label="现金" value="现金" />
          <el-option label="月卡抵扣" value="月卡抵扣" />
        </el-select>
        <div class="btns">
          <el-button type="primary" @click="onSearch"><el-icon><Search /></el-icon>查询</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button :loading="loading" @click="exportData"><el-icon><Download /></el-icon>导出CSV</el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="12">
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-title">本周各时段车流热力图</div>
          </template>
          <div ref="heatRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-title">近30天营收 & 客单价</div>
          </template>
          <div ref="trendRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :span="6" v-for="(card, i) in statCards" :key="i">
        <el-card class="sum-card" shadow="never">
          <div class="sum-label">{{ card.label }}</div>
          <div class="sum-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="sum-sub">{{ card.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card" shadow="never">
      <el-table :data="pagedList" stripe style="margin-top: 4px">
        <el-table-column prop="orderNo" label="订单号" width="170" />
        <el-table-column prop="plate" label="车牌" width="110" />
        <el-table-column prop="parkName" label="停车场" min-width="160" show-overflow-tooltip />
        <el-table-column label="支付方式" width="110">
          <template #default="{ row }">
            <el-tag :type="payTagType(row.payType)" size="small">{{ row.payType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            <span style="color:#F56C6C;font-weight:700">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="entryTime" label="入场时间" width="160" />
        <el-table-column prop="exitTime" label="出场时间" width="160" />
        <el-table-column prop="duration" label="停车时长" width="110" />
        <el-table-column prop="operator" label="操作员" width="100" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page" v-model:page-size="size"
        :total="filtered.length" :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 12px; justify-content: flex-end"
        background
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

type Rec = {
  orderNo: string; plate: string; parkId: string; parkName: string
  payType: string; amount: number; entryTime: string; exitTime: string
  duration: string; stayMin: number; operator: string
}

const parks = [
  { id: 'P001', name: '国贸中心' }, { id: 'P002', name: '金融街地下' },
  { id: 'P003', name: '科技园B3' }, { id: 'P004', name: '万象城B2' },
  { id: 'P005', name: '高铁站北' }, { id: 'P006', name: '机场T3' },
  { id: 'P007', name: '万达广场' }, { id: 'P008', name: '人民广场' },
  { id: 'P009', name: '奥体中心' }, { id: 'P010', name: '软件园' },
  { id: 'P011', name: '大学城' }, { id: 'P012', name: '会展中心' }
]

const payMethods = ['无感支付', '微信', '支付宝', '现金', '月卡抵扣']
const operators = ['系统', '自动', '王静', '刘强', '张伟', '陈静']
const plates = ['京A99999', '京B12345', '京C11111', '京D88888', '京E22222', '沪C33333', '沪F67890', '沪H99888', '粤A66666', '粤E55555', '粤G24680', '粤J77777', '苏D56789']

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pad = (n: number) => String(n).padStart(2, '0')
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`

const genRecords = (): Rec[] => {
  const arr: Rec[] = []
  const base = new Date()
  for (let i = 0; i < 50; i++) {
    const dayOffset = rnd(0, 29)
    const entryH = rnd(6, 22); const entryM = rnd(0, 59)
    const stayMin = rnd(20, 480)
    const entry = new Date(base); entry.setDate(entry.getDate() - dayOffset); entry.setHours(entryH, entryM, 0, 0)
    const exit = new Date(entry.getTime() + stayMin * 60_000)
    const p = parks[rnd(0, parks.length - 1)]
    const pay = payMethods[rnd(0, payMethods.length - 1)]
    const plate = plates[rnd(0, plates.length - 1)]
    const amount = +(rnd(5, 150) + Math.random()).toFixed(2)
    const h = Math.floor(stayMin / 60); const m = stayMin % 60
    const duration = h > 0 ? (m > 0 ? `${h}h${m}m` : `${h}h`) : `${m}m`
    arr.push({
      orderNo: 'IN' + fmtDate(entry).replace(/-/g, '').slice(0, 8) + String(rnd(1, 999)).padStart(4, '0'),
      plate, parkId: p.id, parkName: p.name, payType: pay, amount,
      entryTime: fmtDate(entry), exitTime: fmtDate(exit), duration, stayMin,
      operator: operators[rnd(0, operators.length - 1)]
    })
  }
  return arr.sort((a, b) => b.entryTime.localeCompare(a.entryTime))
}

const records = ref<Rec[]>(genRecords())

const range = ref<[string, string] | null>(null)
const parkFilter = ref('')
const plate = ref('')
const payFilter = ref('')
const page = ref(1)
const size = ref(10)
const loading = ref(false)

const filtered = computed(() => records.value.filter(r => {
  if (parkFilter.value && r.parkId !== parkFilter.value) return false
  if (plate.value && !r.plate.includes(plate.value)) return false
  if (payFilter.value && r.payType !== payFilter.value) return false
  if (range.value && range.value.length === 2) {
    const day = r.entryTime.slice(0, 10)
    if (day < range.value[0] || day > range.value[1]) return false
  }
  return true
}))

const totalIncome = computed(() => filtered.value.reduce((s, r) => s + r.amount, 0))
const totalTrips = computed(() => filtered.value.length)
const avgPrice = computed(() => totalTrips.value ? totalIncome.value / totalTrips.value : 0)
const avgStayMin = computed(() => {
  if (!totalTrips.value) return 0
  return filtered.value.reduce((s, r) => s + r.stayMin, 0) / totalTrips.value
})

const statCards = computed(() => [
  { label: '总营收', value: `¥${totalIncome.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: '本月所有停车场合计', color: '#E6A23C' },
  { label: '平均客单价', value: `¥${avgPrice.value.toFixed(2)}`, sub: `共 ${totalTrips.value} 笔订单`, color: '#67C23A' },
  { label: '总车次', value: totalTrips.value.toLocaleString('en-US'), sub: '已完成支付订单数', color: '#409EFF' },
  { label: '平均停车时长', value: `${Math.round(avgStayMin.value)} 分钟`, sub: '单次平均停留', color: '#909399' }
])

const pagedList = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))

const heatRef = ref<HTMLElement>()
const trendRef = ref<HTMLElement>()
let heatChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

const hours = Array.from({ length: 24 }, (_, i) => `${pad(i)}:00`)
const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const buildHeatData = () => {
  const out: [number, number, number][] = []
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      let base = rnd(10, 60)
      if ((d < 5 && (h >= 8 && h <= 10 || h >= 17 && h <= 19)) || (d >= 5 && h >= 10 && h <= 20)) base = rnd(55, 95)
      out.push([h, d, base])
    }
  }
  return out
}

const heatData = ref(buildHeatData())

const buildTrendData = () => {
  const daysArr: string[] = []; const income: number[] = []; const price: number[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    daysArr.push(`${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
    const trips = rnd(80, 260)
    const avg = +(rnd(15, 65) + Math.random()).toFixed(2)
    income.push(+(trips * avg / 1000).toFixed(2))
    price.push(avg)
  }
  return { daysArr, income, price }
}

const trend = ref(buildTrendData())

const initCharts = () => {
  if (!heatRef.value || !trendRef.value) return
  heatChart = echarts.init(heatRef.value)
  trendChart = echarts.init(trendRef.value)

  heatChart.setOption({
    title: { text: '', left: 'center' },
    tooltip: {
      formatter: (p: any) => {
        const [h, d, v] = p.data
        const rate = Math.round(v)
        return `<div style="font-size:12px">
          <div><b>${days[d]} ${pad(h)}:00 - ${pad(h)}:59</b></div>
          <div>车流 ${rate} 辆</div>
        </div>`
      }
    },
    grid: { left: 46, right: 20, top: 20, bottom: 36 },
    xAxis: { type: 'category', data: hours, splitArea: { show: true }, axisLabel: { fontSize: 10, interval: 2 } },
    yAxis: { type: 'category', data: days, splitArea: { show: true }, axisLabel: { fontSize: 11 } },
    visualMap: { min: 0, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
      inRange: { color: ['#F56C6C', '#E6A23C', '#67C23A'] } },
    series: [{ type: 'heatmap', data: heatData.value, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.4)' } } }]
  })

  trendChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['营收(千元)', '客单价(元)'], top: 0 },
    grid: { left: 46, right: 60, top: 34, bottom: 30 },
    xAxis: { type: 'category', data: trend.value.daysArr, axisLabel: { fontSize: 10, interval: 4 } },
    yAxis: [
      { type: 'value', name: '千元', position: 'left', splitLine: { lineStyle: { type: 'dashed' } } },
      { type: 'value', name: '元', position: 'right', splitLine: { show: false } }
    ],
    series: [
      { name: '营收(千元)', type: 'bar', data: trend.value.income, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#409EFF' }, { offset: 1, color: '#A0CFFF' }
      ]), borderRadius: [4, 4, 0, 0] }, barGap: '10%' },
      { name: '客单价(元)', type: 'line', yAxisIndex: 1, smooth: true, data: trend.value.price,
        lineStyle: { color: '#F56C6C', width: 2 },
        itemStyle: { color: '#F56C6C' },
        symbol: 'circle', symbolSize: 5 }
    ]
  })
}

const resizeCharts = () => {
  heatChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', resizeCharts)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  heatChart?.dispose(); trendChart?.dispose()
  heatChart = null; trendChart = null
})

const payTagType = (t: string) => {
  if (t === '无感支付') return 'success'
  if (t === '微信') return 'warning'
  if (t === '支付宝') return 'primary'
  if (t === '现金') return 'info'
  return ''
}

const onSearch = () => { page.value = 1; ElMessage.success('已查询') }
const reset = () => {
  range.value = null; parkFilter.value = ''; plate.value = ''; payFilter.value = ''; page.value = 1
}
const exportData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`已导出 ${filtered.value.length} 条记录为 CSV`)
  }, 700)
}
const viewDetail = (r: Rec) => { ElMessage.info(`订单 ${r.orderNo} 详情`) }
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; gap: 12px; }

.filter-card { border-radius: 8px; }
.filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.btns { display: flex; gap: 8px; margin-left: auto; }

.chart-card { border-radius: 8px; }
.chart-card :deep(.el-card__header) { padding: 10px 18px; border-bottom: 1px solid #ebeef5; }
.chart-title { font-size: 14px; font-weight: 600; color: #303133; }
.chart-box { width: 100%; height: 300px; }

.sum-card { border-radius: 8px; }
.sum-card :deep(.el-card__body) { padding: 18px 20px; }
.sum-label { font-size: 13px; color: #909399; }
.sum-value { font-size: 26px; font-weight: 700; margin-top: 6px; }
.sum-sub { font-size: 12px; color: #C0C4CC; margin-top: 4px; }

.table-card { border-radius: 8px; }
</style>
