<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <div class="toolbar">
        <div class="search">
          <el-input v-model="plate" placeholder="请输入车牌号" clearable style="width: 220px" @keyup.enter="search">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="openDialog">手动新增出场</el-button>
        </div>
      </div>

      <el-table :data="list" border stripe style="margin-top: 12px">
        <el-table-column prop="entryNo" label="入场单号" width="160" />
        <el-table-column prop="plate" label="车牌" width="120" />
        <el-table-column prop="parkName" label="停车场" min-width="160" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column prop="entryTime" label="入场时间" width="170" />
        <el-table-column prop="exitTime" label="出场时间" width="170" />
        <el-table-column label="停车时长" width="110">
          <template #default="{ row }">
            {{ row.duration }}
          </template>
        </el-table-column>
        <el-table-column label="费用(元)" width="110">
          <template #default="{ row }">
            <span style="color:#F56C6C;font-weight:600">{{ row.fee.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payType" label="支付方式" width="100" />
        <el-table-column prop="operator" label="操作员" width="100" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag type="success" size="small">已出场</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog" title="车辆出场结算" width="560" :close-on-click-modal="false">
      <el-form :model="form" ref="formRef" label-width="100px" size="large">
        <el-form-item label="入场单号"><el-input v-model="form.entryNo" disabled /></el-form-item>
        <el-form-item label="车牌号"><el-input v-model="form.plate" disabled /></el-form-item>
        <el-form-item label="停车场"><el-input v-model="form.parkName" disabled /></el-form-item>
        <el-form-item label="入场时间"><el-input v-model="form.entryTime" disabled /></el-form-item>
        <el-form-item label="出场时间">
          <el-date-picker v-model="form.exitTime" type="datetime" placeholder="默认当前时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-radio-group v-model="form.payType">
            <el-radio value="无感支付">无感支付</el-radio>
            <el-radio value="微信">微信</el-radio>
            <el-radio value="支付宝">支付宝</el-radio>
            <el-radio value="现金">现金</el-radio>
            <el-radio value="月卡抵扣">月卡抵扣</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="操作员"><el-input v-model="form.operator" /></el-form-item>
        <el-form-item label="应缴费用">
          <div class="fee-box">
            停车 {{ form.duration }} · <span class="fee-amount">¥ {{ form.fee.toFixed(2) }}</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">确认出场</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const calcDuration = (entry: string, exit: string) => {
  const e = new Date(entry.replace(/-/g, '/')).getTime()
  const x = new Date(exit.replace(/-/g, '/')).getTime()
  const mins = Math.round((x - e) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h${m}m`, mins
}

const calcFee = (mins: number, parkFee: number) => {
  const hours = Math.ceil(mins / 60)
  let fee = parkFee
  if (hours > 1) fee += (hours - 1) * Math.round(parkFee / 2)
  if (fee > 80) fee = 80
  return fee
}

const parks: any = {
  P001: { name: '国贸中心地下停车场', fee: 10 },
  P002: { name: '金融街A区停车场', fee: 8 },
  P003: { name: '科技园P1停车场', fee: 6 },
  P004: { name: '万象城购物中心', fee: 15 },
  P005: { name: '高铁站东广场', fee: 12 }
}

const list = ref([
  { entryNo: 'IN202606230004', plate: '京D99999', parkId: 'P001', parkName: parks.P001.name, type: '中型车',
    entryTime: '2026-06-23 09:21:35', exitTime: '2026-06-23 12:05:11', duration: '2h43m', fee: 16, payType: '无感支付', operator: '自动' },
  { entryNo: 'IN202606230006', plate: '沪C33333', parkId: 'P003', parkName: parks.P003.name, type: '小型车',
    entryTime: '2026-06-23 07:30:00', exitTime: '2026-06-23 17:45:20', duration: '10h15m', fee: 26, payType: '微信', operator: '王静' },
  { entryNo: 'IN202606230007', plate: '粤E55555', parkId: 'P004', parkName: parks.P004.name, type: '小型车',
    entryTime: '2026-06-23 11:00:00', exitTime: '2026-06-23 15:30:10', duration: '4h30m', fee: 35, payType: '支付宝', operator: '刘强' },
  { entryNo: 'IN202606220018', plate: '京A99999', parkId: 'P005', parkName: parks.P005.name, type: '大型车',
    entryTime: '2026-06-22 06:00:00', exitTime: '2026-06-22 23:55:00', duration: '17h55m', fee: 80, payType: '月卡抵扣', operator: '系统' }
])

const currentList = ref([
  { entryNo: 'IN202606230001', plate: '京A12345', parkId: 'P001', parkName: parks.P001.name, type: '小型车', entryTime: '2026-06-23 07:15:22' },
  { entryNo: 'IN202606230002', plate: '京B88888', parkId: 'P002', parkName: parks.P002.name, type: '新能源', entryTime: '2026-06-23 08:02:10' },
  { entryNo: 'IN202606230005', plate: '粤E77777', parkId: 'P004', parkName: parks.P004.name, type: '小型车', entryTime: '2026-06-23 10:05:44' }
])

const plate = ref('')
const dialog = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<{
  entryNo: string; plate: string; parkName: string; entryTime: string; exitTime: string;
  duration: string; mins: number; fee: number; payType: string; operator: string
}>({
  entryNo: '', plate: '', parkName: '', entryTime: '', exitTime: '',
  duration: '', mins: 0, fee: 0, payType: '无感支付', operator: sessionStorage.getItem('username') || ''
})

const feeWatch = computed(() => {
  if (!form.entryTime) return 0
  const exit = form.exitTime || (() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  })()
  const [dur, mins] = calcDuration(form.entryTime, exit)
  form.duration = dur
  form.mins = mins
  const parkId = currentList.value.find(x => x.entryNo === form.entryNo)?.parkId || 'P001'
  form.fee = calcFee(mins, parks[parkId]?.fee || 8)
  return form.fee
})

const openDialog = () => {
  if (currentList.value.length === 0) { ElMessage.warning('当前没有在场车辆'); return }
  const r = currentList.value[0]
  const now = () => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  Object.assign(form, { entryNo: r.entryNo, plate: r.plate, parkName: r.parkName, entryTime: r.entryTime, exitTime: now(), duration: '', mins: 0, fee: 0, payType: '无感支付', operator: sessionStorage.getItem('username') || '' })
  feeWatch.value
  dialog.value = true
}

const search = () => {
  if (!plate.value) { ElMessage.warning('请输入车牌号'); return }
  const r = currentList.value.find(x => x.plate.toUpperCase() === plate.value.toUpperCase())
  if (!r) { ElMessage.error(`未找到车牌 ${plate.value} 的在场记录`); return }
  const now = () => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  Object.assign(form, { entryNo: r.entryNo, plate: r.plate, parkName: r.parkName, entryTime: r.entryTime, exitTime: now(), duration: '', mins: 0, fee: 0, payType: '无感支付', operator: sessionStorage.getItem('username') || '' })
  feeWatch.value
  dialog.value = true
}

const submit = () => {
  list.value.unshift({
    entryNo: form.entryNo, plate: form.plate, parkName: form.parkName,
    parkId: currentList.value.find(x => x.entryNo === form.entryNo)?.parkId || 'P001',
    type: currentList.value.find(x => x.entryNo === form.entryNo)?.type || '小型车',
    entryTime: form.entryTime, exitTime: form.exitTime,
    duration: form.duration, fee: form.fee, payType: form.payType, operator: form.operator
  })
  currentList.value = currentList.value.filter(x => x.entryNo !== form.entryNo)
  ElMessage.success(`出场成功，应收 ¥${form.fee.toFixed(2)}`)
  dialog.value = false
}
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; gap: 12px; }
.card { border-radius: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.fee-box {
  padding: 14px 20px; background: #fef0f0; border-radius: 8px;
  color: #606266; font-size: 13px;
}
.fee-amount { color: #F56C6C; font-size: 26px; font-weight: 700; margin-left: 8px; }
</style>
