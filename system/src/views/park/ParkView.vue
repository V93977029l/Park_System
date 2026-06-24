<template>
  <div class="page">
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="search-row">
          <el-input v-model="query" placeholder="按名称 / 地址搜索停车场" clearable style="width: 300px" @keyup.enter="onSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增停车场</el-button>
        </div>
        <el-button :disabled="true"><el-icon><Warning /></el-icon>批量下线</el-button>
      </div>
    </el-card>

    <el-row :gutter="12">
      <el-col v-for="park in pagedList" :key="park.id" :span="8" style="margin-bottom: 12px">
        <el-card class="park-card" shadow="hover">
          <div class="card-top">
            <span class="park-code">{{ park.id }} · {{ park.name }}</span>
            <el-tag :type="park.online === 'online' ? 'success' : (park.online === 'maintenance' ? 'primary' : 'info')" size="small">
              {{ park.online === 'online' ? '在线' : (park.online === 'maintenance' ? '维护' : '离线') }}
            </el-tag>
          </div>
          <div class="card-name">
            <div class="title">{{ park.name }}</div>
            <div class="sub">{{ park.address }}</div>
          </div>
          <div class="stats-row">
            <div class="mini">
              <div class="mini-label">占用率</div>
              <el-progress :percentage="park.rate" :color="progressColor(park.rate)" :stroke-width="10" :show-text="false" />
              <div class="mini-num" :style="{ color: progressColor(park.rate) }">{{ park.rate }}%</div>
            </div>
            <div class="mid">
              <div class="mid-num blue">{{ park.free }}</div>
              <div class="mid-txt">空闲 / 总 {{ park.total }}</div>
            </div>
            <div class="right">
              <div class="right-num">¥{{ formatMoney(park.todayIncome) }}</div>
              <div class="right-txt">今日营收</div>
            </div>
          </div>
          <div class="card-actions">
            <el-button link type="primary" @click="goDetail(park)">详情列表</el-button>
            <el-button link type="primary" @click="goSlot(park)">车位</el-button>
            <el-button link type="primary" @click="handleEdit(park)">编辑</el-button>
            <el-popconfirm title="确认下线该停车场？" @confirm="handleOffline(park)">
              <template #reference><el-button link type="danger">下线</el-button></template>
            </el-popconfirm>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="pager-card" shadow="never">
      <el-pagination
        v-model:current-page="page" v-model:page-size="size"
        :total="filtered.length" :page-sizes="[6, 9, 12, 18]"
        layout="total, sizes, prev, pager, next"
        background
      />
    </el-card>

    <el-dialog v-model="dialog" :title="form.id ? '编辑停车场' : '新增停车场'" width="520" :close-on-click-modal="false">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" placeholder="请输入停车场名称" /></el-form-item>
        <el-form-item label="地址" prop="address"><el-input v-model="form.address" placeholder="请输入详细地址" /></el-form-item>
        <el-form-item label="总车位" prop="total"><el-input-number v-model="form.total" :min="10" :max="10000" style="width: 100%" /></el-form-item>
        <el-form-item label="今日营收(¥)" prop="todayIncome"><el-input-number v-model="form.todayIncome" :min="0" :precision="2" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Warning } from '@element-plus/icons-vue'

const router = useRouter()

type Park = {
  id: string; name: string; address: string; free: number; total: number
  todayIncome: number; online: 'online' | 'offline' | 'maintenance'; rate: number
}

const raw: Omit<Park, 'rate'>[] = [
  { id: 'P001', name: '国贸中心', address: '建国门外大街1号', free: 234, total: 360, todayIncome: 4280, online: 'online' },
  { id: 'P002', name: '金融街地下', address: '西城区金融街3号楼', free: 67, total: 420, todayIncome: 6120, online: 'online' },
  { id: 'P003', name: '科技园B3', address: '海淀区中关村科技园9号', free: 410, total: 1200, todayIncome: 3050, online: 'online' },
  { id: 'P004', name: '万象城B2', address: '朝阳区三里屯万象城', free: 120, total: 880, todayIncome: 7980, online: 'online' },
  { id: 'P005', name: '高铁站北', address: '丰台区北京南站北广场', free: 250, total: 1500, todayIncome: 8820, online: 'online' },
  { id: 'P006', name: '机场T3', address: '大兴区大兴机场T3', free: 180, total: 2000, todayIncome: 12500, online: 'online' },
  { id: 'P007', name: '万达广场', address: '朝阳区望京SOHO', free: 220, total: 500, todayIncome: 2100, online: 'maintenance' },
  { id: 'P008', name: '人民广场', address: '东城区人民广场地下', free: 40, total: 360, todayIncome: 1880, online: 'online' },
  { id: 'P009', name: '奥体中心', address: '朝阳区国家体育场路', free: 760, total: 1800, todayIncome: 3450, online: 'online' },
  { id: 'P010', name: '软件园', address: '海淀区软件园C座', free: 80, total: 360, todayIncome: 920, online: 'offline' },
  { id: 'P011', name: '大学城', address: '海淀区大学城东门', free: 290, total: 600, todayIncome: 1560, online: 'online' },
  { id: 'P012', name: '会展中心', address: '朝阳区国家会议中心B2', free: 100, total: 1500, todayIncome: 15200, online: 'online' }
]

const parks = ref<Park[]>(raw.map(r => ({ ...r, rate: Math.round((r.total - r.free) / r.total * 100) })))

const query = ref('')
const page = ref(1)
const size = ref(6)
const dialog = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ id: '', name: '', address: '', free: 50, total: 300, todayIncome: 0, online: 'online' as const })

const rules: FormRules = {
  name: [{ required: true, message: '请输入停车场名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  total: [{ required: true, message: '请输入总车位', trigger: 'change' }]
}

const filtered = computed(() =>
  parks.value.filter(p => !query.value || p.name.includes(query.value) || p.address.includes(query.value))
)
const pagedList = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))

const progressColor = (rate: number) => {
  if (rate < 70) return '#67C23A'
  if (rate <= 90) return '#E6A23C'
  return '#F56C6C'
}
const formatMoney = (n: number) => n.toLocaleString('en-US')

const onSearch = () => { page.value = 1 }
const resetForm = () => {
  Object.assign(form, { id: '', name: '', address: '', free: 50, total: 300, todayIncome: 0, online: 'online' })
}
const handleAdd = () => { resetForm(); dialog.value = true }
const handleEdit = (p: Park) => { Object.assign(form, { ...p, online: p.online }); dialog.value = true }
const handleOffline = (p: Park) => {
  const i = parks.value.findIndex(x => x.id === p.id)
  if (i > -1) parks.value[i].online = 'offline'
  ElMessage.success('已下线')
}
const goDetail = (p: Park) => { ElMessage.info(`查看 ${p.name} 详情`) }
const goSlot = (p: Park) => {
  router.push({ path: '/main/slots', query: { parkId: p.id, parkName: p.name } })
}
const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    if (form.id) {
      const i = parks.value.findIndex(x => x.id === form.id)
      if (i > -1) {
        const updated: Park = {
          ...form,
          rate: Math.round((form.total - form.free) / form.total * 100)
        }
        parks.value.splice(i, 1, updated)
      }
      ElMessage.success('编辑成功')
    } else {
      const newP: Park = {
        id: 'P' + String(parks.value.length + 1).padStart(3, '0'),
        name: form.name, address: form.address, free: form.free, total: form.total,
        todayIncome: form.todayIncome, online: form.online,
        rate: Math.round((form.total - form.free) / form.total * 100)
      }
      parks.value.unshift(newP)
      ElMessage.success('新增成功')
    }
    dialog.value = false
  })
}
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; gap: 12px; }
.toolbar-card { border-radius: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.search-row { display: flex; align-items: center; gap: 10px; }

.park-card {
  border-radius: 10px; transition: transform .2s, box-shadow .2s;
  &:hover { transform: translateY(-2px); }
}
:deep(.el-card__body) { padding: 16px 18px; }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.park-code { font-size: 12px; color: #909399; letter-spacing: .3px; }

.card-name { margin-bottom: 14px; }
.title { font-size: 18px; font-weight: 600; color: #303133; line-height: 1.3; }
.sub { font-size: 12px; color: #909399; margin-top: 2px; }

.stats-row { display: flex; gap: 12px; padding: 12px 0; border-top: 1px dashed #ebeef5; border-bottom: 1px dashed #ebeef5; align-items: center; }
.mini { flex: 1; }
.mini-label { font-size: 11px; color: #909399; margin-bottom: 6px; }
.mini-num { font-size: 15px; font-weight: 700; text-align: right; margin-top: 4px; }
.mid { flex: 1; text-align: center; }
.mid-num { font-size: 22px; font-weight: 700; }
.mid-num.blue { color: #409EFF; }
.mid-txt { font-size: 12px; color: #909399; margin-top: 2px; }
.right { flex: 1; text-align: right; }
.right-num { font-size: 20px; font-weight: 700; color: #E6A23C; }
.right-txt { font-size: 12px; color: #909399; margin-top: 2px; }

.card-actions { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; }

.pager-card { border-radius: 8px; display: flex; justify-content: flex-end; }
</style>
