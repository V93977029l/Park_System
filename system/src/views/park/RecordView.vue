<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <div class="toolbar">
        <div class="search">
          <el-date-picker v-model="range" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 340px" />
          <el-select v-model="parkFilter" placeholder="全部停车场" clearable style="width: 200px">
            <el-option v-for="p in parks" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-input v-model="plate" placeholder="车牌号" clearable style="width: 180px" />
          <el-select v-model="payFilter" placeholder="全部支付" clearable style="width: 140px">
            <el-option label="无感支付" value="无感支付" />
            <el-option label="微信" value="微信" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="现金" value="现金" />
            <el-option label="月卡抵扣" value="月卡抵扣" />
          </el-select>
          <el-button type="primary" @click="onSearch"><el-icon><Search /></el-icon>查询</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
        <div class="btns">
          <el-button :loading="loading" @click="exportData"><el-icon><Download /></el-icon>导出</el-button>
        </div>
      </div>

      <div class="summary">
        <div class="sum-item">
          <div class="sum-label">总记录</div>
          <div class="sum-value">{{ filtered.length }}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">总营收</div>
          <div class="sum-value green">¥ {{ totalFee.toFixed(2) }}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">平均停车</div>
          <div class="sum-value">{{ avgDuration }}</div>
        </div>
        <div class="sum-item">
          <div class="sum-label">最高收费</div>
          <div class="sum-value">¥ {{ maxFee.toFixed(2) }}</div>
        </div>
      </div>

      <el-table :data="pagedList" border stripe style="margin-top: 12px">
        <el-table-column prop="entryNo" label="入场单号" width="160" />
        <el-table-column prop="plate" label="车牌" width="120" />
        <el-table-column prop="parkName" label="停车场" min-width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column prop="entryTime" label="入场时间" width="170" />
        <el-table-column prop="exitTime" label="出场时间" width="170" />
        <el-table-column label="时长" width="100">
          <template #default="{ row }">{{ row.duration }}</template>
        </el-table-column>
        <el-table-column label="费用(元)" width="110">
          <template #default="{ row }">
            <span style="color:#F56C6C;font-weight:600">{{ row.fee.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payType" label="支付方式" width="100" />
        <el-table-column prop="operator" label="操作员" width="100" />
      </el-table>

      <el-pagination
        v-model:current-page="page" v-model:page-size="size"
        :total="filtered.length" :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 12px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'

const parks = [
  { id: 'P001', name: '国贸中心地下停车场' },
  { id: 'P002', name: '金融街A区停车场' },
  { id: 'P003', name: '科技园P1停车场' },
  { id: 'P004', name: '万象城购物中心' },
  { id: 'P005', name: '高铁站东广场' }
]

const genDate = (base: string, dayOffset: number, h: number, m: number) => {
  const d = new Date(base.replace(/-/g, '/'))
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

const records = ref([
  { entryNo: 'IN202606220018', plate: '京A99999', parkId: 'P005', parkName: parks[4].name, type: '大型车', entryTime: genDate('2026-06-22', 0, 6, 0), exitTime: genDate('2026-06-22', 0, 23, 55), duration: '17h55m', fee: 80, payType: '月卡抵扣', operator: '系统' },
  { entryNo: 'IN202606230004', plate: '京D99999', parkId: 'P001', parkName: parks[0].name, type: '中型车', entryTime: genDate('2026-06-23', 0, 9, 21), exitTime: genDate('2026-06-23', 0, 12, 5), duration: '2h43m', fee: 16, payType: '无感支付', operator: '自动' },
  { entryNo: 'IN202606230006', plate: '沪C33333', parkId: 'P003', parkName: parks[2].name, type: '小型车', entryTime: genDate('2026-06-23', 0, 7, 30), exitTime: genDate('2026-06-23', 0, 17, 45), duration: '10h15m', fee: 26, payType: '微信', operator: '王静' },
  { entryNo: 'IN202606230007', plate: '粤E55555', parkId: 'P004', parkName: parks[3].name, type: '小型车', entryTime: genDate('2026-06-23', 0, 11, 0), exitTime: genDate('2026-06-23', 0, 15, 30), duration: '4h30m', fee: 35, payType: '支付宝', operator: '刘强' },
  { entryNo: 'IN202606220012', plate: '京B12345', parkId: 'P002', parkName: parks[1].name, type: '新能源', entryTime: genDate('2026-06-22', 0, 8, 0), exitTime: genDate('2026-06-22', 0, 12, 10), duration: '4h10m', fee: 20, payType: '无感支付', operator: '系统' },
  { entryNo: 'IN202606210033', plate: '沪F67890', parkId: 'P001', parkName: parks[0].name, type: '小型车', entryTime: genDate('2026-06-21', 0, 9, 0), exitTime: genDate('2026-06-21', 0, 18, 0), duration: '9h0m', fee: 50, payType: '现金', operator: '张伟' },
  { entryNo: 'IN202606200055', plate: '粤G24680', parkId: 'P005', parkName: parks[4].name, type: '大型车', entryTime: genDate('2026-06-20', 0, 14, 0), exitTime: genDate('2026-06-20', 0, 15, 30), duration: '1h30m', fee: 20, payType: '无感支付', operator: '系统' },
  { entryNo: 'IN202606210041', plate: '京C11111', parkId: 'P003', parkName: parks[2].name, type: '小型车', entryTime: genDate('2026-06-21', 0, 10, 0), exitTime: genDate('2026-06-21', 0, 20, 0), duration: '10h0m', fee: 30, payType: '微信', operator: '王静' },
  { entryNo: 'IN202606200019', plate: '沪H99888', parkId: 'P004', parkName: parks[3].name, type: '小型车', entryTime: genDate('2026-06-20', 0, 12, 0), exitTime: genDate('2026-06-20', 0, 14, 0), duration: '2h0m', fee: 15, payType: '支付宝', operator: '刘强' },
  { entryNo: 'IN202606220028', plate: '粤A66666', parkId: 'P001', parkName: parks[0].name, type: '新能源', entryTime: genDate('2026-06-22', 0, 16, 0), exitTime: genDate('2026-06-22', 0, 22, 0), duration: '6h0m', fee: 30, payType: '无感支付', operator: '系统' },
  { entryNo: 'IN202606230021', plate: '京E22222', parkId: 'P002', parkName: parks[1].name, type: '小型车', entryTime: genDate('2026-06-23', 0, 8, 45), exitTime: genDate('2026-06-23', 0, 12, 30), duration: '3h45m', fee: 20, payType: '微信', operator: '王静' },
  { entryNo: 'IN202606190066', plate: '沪J33333', parkId: 'P005', parkName: parks[4].name, type: '小型车', entryTime: genDate('2026-06-19', 0, 7, 0), exitTime: genDate('2026-06-19', 0, 19, 30), duration: '12h30m', fee: 60, payType: '现金', operator: '张伟' }
])

const range = ref<any>(null)
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
    const t = new Date(r.exitTime.replace(/-/g, '/')).getTime()
    const s = new Date(String(range.value[0]).replace(/-/g, '/')).getTime()
    const e = new Date(String(range.value[1]).replace(/-/g, '/')).getTime()
    if (t < s || t > e) return false
  }
  return true
}))

const totalFee = computed(() => filtered.value.reduce((s, r) => s + r.fee, 0))
const maxFee = computed(() => Math.max(...filtered.value.map(r => r.fee), 0))
const avgDuration = computed(() => {
  if (filtered.value.length === 0) return '0'
  const toMin = (d: string) => {
    const m = d.match(/(\d+)h(?:(\d+)m)?/)
    if (!m) return 0
    return Number(m[1]) * 60 + Number(m[2] || 0)
  }
  const avg = filtered.value.reduce((s, r) => s + toMin(r.duration), 0) / filtered.value.length
  const h = Math.floor(avg / 60)
  const m = Math.round(avg % 60)
  return h > 0 ? `${h}h${m}m` : `${m}m`
})

const pagedList = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))

const onSearch = () => { page.value = 1 }
const reset = () => {
  range.value = null; parkFilter.value = ''; plate.value = ''; payFilter.value = ''; page.value = 1
}

const exportData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`已导出 ${filtered.value.length} 条记录`)
  }, 800)
}
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; gap: 12px; }
.card { border-radius: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 12px; }
.sum-item {
  background: #fafafa; border: 1px solid #ebeef5; border-radius: 8px;
  padding: 16px 20px;
}
.sum-label { color: #909399; font-size: 13px; }
.sum-value { font-size: 22px; font-weight: 600; color: #303133; margin-top: 6px; }
.sum-value.green { color: #67C23A; }
</style>
