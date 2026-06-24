<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="card" shadow="never">
          <template #header><span class="card-title">车辆入场登记</span></template>
          <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" size="large">
            <el-form-item label="停车场" prop="parkId">
              <el-select v-model="form.parkId" placeholder="请选择停车场" style="width: 100%">
                <el-option v-for="p in parks" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="车牌号" prop="plate">
              <el-input v-model="form.plate" placeholder="如 京A12345" @blur="autoFill" />
            </el-form-item>
            <el-form-item label="车辆类型">
              <el-radio-group v-model="form.type">
                <el-radio value="小型车">小型车</el-radio>
                <el-radio value="中型车">中型车</el-radio>
                <el-radio value="大型车">大型车</el-radio>
                <el-radio value="新能源">新能源</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="入场方式">
              <el-radio-group v-model="form.entryType">
                <el-radio value="车牌识别">车牌识别</el-radio>
                <el-radio value="人工登记">人工登记</el-radio>
                <el-radio value="月卡自动">月卡自动</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="入场时间">
              <el-date-picker v-model="form.entryTime" type="datetime" placeholder="默认当前时间" style="width: 100%" />
            </el-form-item>
            <el-form-item label="司机电话"><el-input v-model="form.phone" placeholder="可选" /></el-form-item>
            <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" /></el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" @click="submit">确认入场</el-button>
              <el-button size="large" @click="reset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="card" shadow="never">
          <template #header><span class="card-title">今日入场记录（{{ todayList.length }}）</span></template>
          <el-table :data="todayList" border stripe max-height="480">
            <el-table-column prop="entryNo" label="单号" width="130" />
            <el-table-column prop="plate" label="车牌" width="120" />
            <el-table-column prop="parkName" label="停车场" min-width="150" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="entryTime" label="入场时间" width="170" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag v-if="!row.exitTime" type="warning" size="small">在场</el-tag>
                <el-tag v-else type="success" size="small">已出场</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const parks = [
  { id: 'P001', name: '国贸中心地下停车场' },
  { id: 'P002', name: '金融街A区停车场' },
  { id: 'P003', name: '科技园P1停车场' },
  { id: 'P004', name: '万象城购物中心' },
  { id: 'P005', name: '高铁站东广场' }
]

const list = ref([
  { entryNo: 'IN202606230001', plate: '京A12345', parkId: 'P001', parkName: '国贸中心地下停车场', type: '小型车', entryType: '车牌识别', entryTime: '2026-06-23 07:15:22', exitTime: '', phone: '13900001111', remark: '' },
  { entryNo: 'IN202606230002', plate: '京B88888', parkId: 'P002', parkName: '金融街A区停车场', type: '新能源', entryType: '月卡自动', entryTime: '2026-06-23 08:02:10', exitTime: '', phone: '', remark: '' },
  { entryNo: 'IN202606230003', plate: '沪C66666', parkId: 'P003', parkName: '科技园P1停车场', type: '小型车', entryType: '车牌识别', entryTime: '2026-06-23 08:45:01', exitTime: '', phone: '', remark: '' },
  { entryNo: 'IN202606230004', plate: '京D99999', parkId: 'P001', parkName: '国贸中心地下停车场', type: '中型车', entryType: '人工登记', entryTime: '2026-06-23 09:21:35', exitTime: '2026-06-23 12:05:11', phone: '13900002222', remark: '访客' },
  { entryNo: 'IN202606230005', plate: '粤E77777', parkId: 'P004', parkName: '万象城购物中心', type: '小型车', entryType: '车牌识别', entryTime: '2026-06-23 10:05:44', exitTime: '', phone: '', remark: '' }
])

const todayList = computed(() => list.value)

const now = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const loading = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  parkId: 'P001', plate: '', type: '小型车', entryType: '车牌识别',
  entryTime: now(), phone: '', remark: ''
})

const rules: FormRules = {
  parkId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
  plate: [{ required: true, message: '请输入车牌号', trigger: 'blur' }]
}

const autoFill = () => {
  const r = list.value.find(x => x.plate.toUpperCase() === form.plate.toUpperCase() && !x.exitTime)
  if (r) {
    ElMessage.warning(`该车牌 ${form.plate} 已在场内（${r.parkName}）`)
  }
}

const resetForm = () => {
  Object.assign(form, { parkId: 'P001', plate: '', type: '小型车', entryType: '车牌识别', entryTime: now(), phone: '', remark: '' })
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    loading.value = true
    try {
      const park = parks.find(p => p.id === form.parkId)
      const no = 'IN' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(list.value.length + 1).padStart(4, '0')
      list.value.unshift({
        entryNo: no,
        plate: form.plate,
        parkId: form.parkId,
        parkName: park?.name || '',
        type: form.type,
        entryType: form.entryType,
        entryTime: form.entryTime || now(),
        exitTime: '',
        phone: form.phone,
        remark: form.remark
      })
      ElMessage.success(`入场成功，单号：${no}`)
      resetForm()
    } finally {
      loading.value = false
    }
  })
}

const reset = () => resetForm()
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; gap: 12px; }
.card { border-radius: 8px; }
.card-title { font-weight: 600; color: #303133; }
</style>
