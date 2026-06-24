<template>
  <div class="slot-page">
    <div class="toolbar">
      <div class="left">
        <el-select v-model="currentPark" style="width: 240px" size="large">
          <el-option v-for="p in parks" :key="p.id" :label="p.label" :value="p.id" />
        </el-select>
      </div>
      <div class="right">
        <el-radio-group v-model="mode" size="large">
          <el-radio-button value="plan">楼层平面图</el-radio-button>
          <el-radio-button value="list">列表视图</el-radio-button>
          <el-radio-button value="heat">实时热力图</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-card class="main-card" shadow="never" v-if="mode === 'plan'">
      <el-tabs v-model="currentFloor" class="floor-tabs">
        <el-tab-pane v-for="f in floors" :key="f" :label="`${f}层`" :name="f" />
      </el-tabs>

      <div class="plan-body">
        <div class="slot-grid">
          <div
            v-for="s in floorSlots" :key="s.id"
            class="slot-cell"
            :class="[s.status, { selected: selectedSlot === s.id }]"
            @click="selectedSlot = s.id; showSlotDetail(s)"
          >
            <div class="slot-top">{{ s.code }}</div>
            <div class="slot-content">
              <template v-if="s.status === 'free'">空闲</template>
              <template v-else-if="s.status === 'used'">
                <span class="plate">{{ s.plate }}</span>
              </template>
              <template v-else-if="s.status === 'reserve'">预约</template>
              <template v-else>⚫</template>
            </div>
          </div>
        </div>

        <div class="side-panel">
          <div class="legend">
            <div class="legend-title">图例说明</div>
            <el-tag type="success" effect="light" class="lg-tag"><span class="dot" style="background:#52c41a"></span>空闲</el-tag>
            <el-tag type="danger" effect="light" class="lg-tag"><span class="dot" style="background:#f5222d"></span>占用</el-tag>
            <el-tag type="warning" effect="light" class="lg-tag"><span class="dot" style="background:#faad14"></span>预约</el-tag>
            <el-tag type="info" effect="light" class="lg-tag"><span class="dot" style="background:#8c8c8c"></span>故障</el-tag>
          </div>

          <div class="summary">
            <div class="summary-title">{{ parkMeta.label }} · {{ currentFloor }}层 汇总</div>
            <div class="sum-row">
              <div class="sum-item free">
                <div class="num">{{ floorSummary.free }}</div>
                <div class="lb">空闲</div>
              </div>
              <div class="sum-item used">
                <div class="num">{{ floorSummary.used }}</div>
                <div class="lb">占用</div>
              </div>
              <div class="sum-item reserve">
                <div class="num">{{ floorSummary.reserve }}</div>
                <div class="lb">预约</div>
              </div>
              <div class="sum-item broken">
                <div class="num">{{ floorSummary.broken }}</div>
                <div class="lb">故障</div>
              </div>
            </div>
            <div class="sum-total">总车位 {{ floorSlots.length }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="main-card" shadow="never" v-if="mode === 'list'">
      <el-table :data="listData" border stripe height="620">
        <el-table-column prop="code" label="车位号" width="110" />
        <el-table-column prop="floor" label="楼层" width="80" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag :type="row.type === 'VIP' ? 'warning' : row.type === '新能源' ? 'success' : ''" size="small">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'free' ? 'success' : row.status === 'used' ? 'danger' : row.status === 'reserve' ? 'warning' : 'info'"
              effect="light" size="small"
            >
              {{ statusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="plate" label="车牌号" min-width="140" />
        <el-table-column prop="inTime" label="入场时间" width="170" />
        <el-table-column prop="remain" label="剩余时长" width="100" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="ElMessage.success(`已为 ${row.code} 开闸`)">开闸</el-button>
            <el-button link type="primary" size="small" @click="ElMessage.info(`编辑 ${row.code}`)">修改</el-button>
            <el-button link type="danger" size="small" @click="ElMessage.warning(`释放 ${row.code}`)">释放</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="main-card heat-card" shadow="never" v-if="mode === 'heat'">
      <div class="heat-title">
        <span class="t">24小时车位占用率热力图</span>
        <span class="sub">12个停车场 × 24小时</span>
      </div>
      <div ref="heatRef" class="heat-chart"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, onBeforeUnmount, ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const parks = [
  { id: '国贸P001', label: '国贸P001 · 国贸中心停车场' },
  { id: '金融街P002', label: '金融街P002 · 金融街A区' },
  { id: '科技园P003', label: '科技园P003 · 科技园P1' },
  { id: '万象城P004', label: '万象城P004 · 万象城购物中心' },
  { id: '高铁站P005', label: '高铁站P005 · 高铁站东广场' },
  { id: '机场T3P006', label: '机场T3P006 · 机场T3航站楼' },
  { id: '万达广场P007', label: '万达广场P007 · 石景山万达' },
  { id: '人民广场P008', label: '人民广场P008 · 上海市人民广场' },
  { id: '奥体中心P009', label: '奥体中心P009 · 国家奥体中心' },
  { id: '软件园P010', label: '软件园P010 · 中关村软件园' },
  { id: '大学城P011', label: '大学城P011 · 大学城智慧停车场' },
  { id: '会展中心P012', label: '会展中心P012 · 国际会展中心' }
]

const parkMeta = computed(() => parks.find(p => p.id === currentPark.value) || parks[0])
const floors = ['A', 'B', 'C', 'D']
const platePools = [
  '京A 12345', '京A 67890', '京A 88888', '京A 00000', '京A A8888',
  '京B 12345', '京B 67890', '京B 88888', '京B 00000', '京B A8888',
  '京C 12345', '京C 67890', '京C 88888', '京C 00000', '京C A8888'
]

const currentPark = ref('国贸P001')
const mode = ref<'plan' | 'list' | 'heat'>('plan')
const currentFloor = ref('A')
const selectedSlot = ref('')
const heatRef = ref<HTMLElement | null>(null)
let heatChart: echarts.ECharts | null = null

const statusMap: Record<string, string> = {
  free: '空闲',
  used: '占用',
  reserve: '预约',
  broken: '故障'
}

function rndStatus() {
  const r = Math.random()
  if (r < 0.6) return 'used'
  if (r < 0.9) return 'free'
  if (r < 0.96) return 'reserve'
  return 'broken'
}

function genFloorSlots(floor: string) {
  const arr: any[] = []
  for (let i = 1; i <= 120; i++) {
    const col = (i - 1) % 15 + 1
    const row = Math.floor((i - 1) / 15) + 1
    const status = rndStatus()
    const typePool = ['普通', '普通', '普通', '普通', '新能源', 'VIP']
    arr.push({
      id: `${currentPark.value}-${floor}${String(i).padStart(3, '0')}`,
      code: `${floor}${String(i).padStart(3, '0')}`,
      floor,
      col,
      row,
      type: typePool[Math.floor(Math.random() * typePool.length)],
      status,
      plate: status === 'used' ? platePools[Math.floor(Math.random() * platePools.length)] : '',
      inTime: status === 'used' ? genInTime() : '',
      remain: status === 'used' ? `${Math.floor(Math.random() * 180 + 15)}分钟` : '-'
    })
  }
  return arr
}

function genInTime() {
  const pad = (n: number) => String(n).padStart(2, '0')
  const now = new Date()
  const mins = now.getTime() - Math.floor(Math.random() * 3 * 60 * 60 * 1000)
  const d = new Date(mins)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const floorSlots = computed(() => genFloorSlots(currentFloor.value))
const listData = computed(() => {
  const arr: any[] = []
  floors.forEach(f => arr.push(...genFloorSlots(f)))
  return arr
})
const floorSummary = computed(() => {
  const slots = floorSlots.value
  return {
    free: slots.filter(s => s.status === 'free').length,
    used: slots.filter(s => s.status === 'used').length,
    reserve: slots.filter(s => s.status === 'reserve').length,
    broken: slots.filter(s => s.status === 'broken').length
  }
})

const heatData = computed(() => {
  const data: [number, number, number][] = []
  for (let p = 0; p < parks.length; p++) {
    for (let h = 0; h < 24; h++) {
      let base = 50 + Math.sin((h - 6) / 6) * 25 + Math.random() * 12
      if (h >= 8 && h <= 10) base += 20
      if (h >= 17 && h <= 20) base += 25
      if (h >= 23 || h <= 5) base -= 30
      base = Math.max(5, Math.min(98, base))
      data.push([h, p, Math.round(base)])
    }
  }
  return data
})

function showSlotDetail(s: any) {
  ElMessage({
    message: `车位: ${s.code} | 类型: ${s.type} | 状态: ${statusMap[s.status]}${s.plate ? ' | 车牌: ' + s.plate : ''}`,
    type: s.status === 'used' ? 'warning' : s.status === 'free' ? 'success' : s.status === 'reserve' ? 'info' : 'error'
  })
}

function renderHeat() {
  if (!heatRef.value) return
  if (!heatChart) {
    heatChart = echarts.init(heatRef.value)
  }
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const parkNames = parks.map(p => p.id)
  heatChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      formatter: (p: any) => {
        const v = p.data
        return `<div style="font-size:12px">
          <b>${parkNames[v[1]]}</b><br/>
          时间: ${hours[v[0]]}<br/>
          占用率: <b>${v[2]}%</b>
        </div>`
      }
    },
    grid: { left: 110, right: 40, top: 24, bottom: 30 },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: { color: '#606266', fontSize: 11 },
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    yAxis: {
      type: 'category',
      data: parkNames,
      splitArea: { show: true },
      axisLabel: { color: '#303133', fontSize: 11 },
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 2,
      inRange: {
        color: ['#e6f7ff', '#bae7ff', '#69c0ff', '#1890ff', '#0050b3', '#002766']
      },
      textStyle: { color: '#606266' },
      format: '{value} %'
    },
    series: [{
      name: '占用率',
      type: 'heatmap',
      data: heatData.value,
      label: { show: true, color: '#fff', fontSize: 10, formatter: (p: any) => (p.data[2] > 60 ? p.data[2] + '%' : '') },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' }
      }
    }]
  })
}

onMounted(() => {
  if (mode.value === 'heat') {
    nextTick(renderHeat)
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (heatChart) {
    heatChart.dispose()
    heatChart = null
  }
})

function handleResize() {
  heatChart?.resize()
}

watch(mode, (m) => {
  if (m === 'heat') {
    nextTick(() => {
      if (!heatChart && heatRef.value) heatChart = echarts.init(heatRef.value)
      renderHeat()
    })
  } else if (m === 'plan') {
    selectedSlot.value = ''
  }
})
</script>

<style scoped lang="scss">
.slot-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f5f7fa;
  min-height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 0 4px;
}

.main-card {
  border-radius: 10px;
  border-color: #ebeef5;
  background: #fff;

  :deep(.el-card__body) {
    padding: 16px 20px 20px;
  }
}

.floor-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }

  :deep(.el-tabs__active-bar) {
    background-color: #409eff;
    height: 3px;
    border-radius: 3px 3px 0 0;
  }

  :deep(.el-tabs__item) {
    padding: 0 22px;
    font-size: 15px;
    font-weight: 500;
  }
}

.plan-body {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.slot-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(15, 60px);
  grid-auto-rows: 44px;
  gap: 8px;
  background: linear-gradient(180deg, #fafafa 0%, #f0f2f5 100%);
  padding: 16px;
  border-radius: 10px;
  border: 1px dashed #dcdfe6;
  justify-content: center;
}

.slot-cell {
  width: 60px;
  height: 44px;
  border-radius: 6px;
  border: 1px solid #000;
  background: #fff;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-family: "KaiTi", "STKaiti", "楷体", serif;
  font-weight: 500;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease;
  line-height: 1.1;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.18);
  }

  &.selected {
    border: 3px solid #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.25);
  }

  .slot-top {
    font-size: 11px;
    opacity: 0.9;
    letter-spacing: 0.5px;
  }

  .slot-content {
    margin-top: 2px;
    font-size: 10px;
    max-width: 54px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }

  &.free {
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    color: #0050b3;
  }

  &.used {
    background: #ffccc7;
    border: 1px solid #ffa39e;
    color: #cf1322;

    .plate {
      font-size: 10px;
      max-width: 54px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: "SimHei", "Heiti SC", "黑体", sans-serif;
      font-weight: 600;
    }
  }

  &.reserve {
    background: #fff1b8;
    border: 1px solid #ffc53d;
    color: #874d00;
  }

  &.broken {
    background: #d9d9d9;
    border: 1px solid #bfbfbf;
    color: #595959;
  }
}

.side-panel {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.legend {
  background: #fafbfc;
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #ebeef5;

  .legend-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px;
  }

  .lg-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 6px 4px 6px 0;
    padding: 0 8px !important;
    height: 24px;
    border-radius: 4px;
    font-size: 12px;
  }

  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 2px;
  }
}

.summary {
  background: linear-gradient(135deg, #409eff 0%, #1677ff 100%);
  color: #fff;
  border-radius: 8px;
  padding: 16px 14px 14px;

  .summary-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .sum-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .sum-item {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    padding: 10px;
    text-align: center;

    .num {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.1;
    }

    .lb {
      font-size: 12px;
      opacity: 0.9;
      margin-top: 2px;
    }

    &.free { .num { color: #b7eb8f; } }
    &.used { .num { color: #ffa39e; } }
    &.reserve { .num { color: #ffc53d; } }
    &.broken { .num { color: #d9d9d9; } }
  }

  .sum-total {
    margin-top: 10px;
    text-align: center;
    font-size: 12px;
    opacity: 0.85;
  }
}

.heat-card {
  .heat-title {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 10px;

    .t {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .sub {
      font-size: 12px;
      color: #909399;
    }
  }

  .heat-chart {
    height: 560px;
    width: 100%;
  }
}
</style>
