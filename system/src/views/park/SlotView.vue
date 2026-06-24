<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <div class="toolbar">
        <div class="search">
          <el-select v-model="parkFilter" placeholder="全部停车场" clearable style="width: 220px" @change="onSearch">
            <el-option v-for="p in parks" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 140px" @change="onSearch">
            <el-option label="空闲" value="free" />
            <el-option label="占用" value="used" />
            <el-option label=" reserved" value="reserved" />
          </el-select>
          <el-input v-model="query" placeholder="请输入车位编号/车牌号" clearable style="width: 220px" @keyup.enter="onSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </div>
        <div class="btns">
          <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增车位</el-button>
        </div>
      </div>

      <div class="grid-wrap">
        <div class="grid-head">
          <span>空闲 {{ freeCount }}</span>
          <span class="used">占用 {{ usedCount }}</span>
          <span class="reserved">预约 {{ reservedCount }}</span>
        </div>
        <div class="grid" v-if="viewMode === 'grid'">
          <div
            v-for="s in pagedList" :key="s.id"
            class="slot"
            :class="[s.status, { hasCar: s.plate }]"
            @click="handleClick(s)"
          >
            <div class="slot-id">{{ s.id }}</div>
            <div v-if="s.plate" class="plate">{{ s.plate }}</div>
            <div v-else class="slot-status">
              <el-icon v-if="s.status === 'free'"><Place /></el-icon>
              <el-icon v-else-if="s.status === 'used'"><Van /></el-icon>
              <el-icon v-else><Clock /></el-icon>
            </div>
          </div>
        </div>
        <el-table v-else :data="pagedList" border stripe style="margin-top: 12px">
          <el-table-column prop="id" label="车位编号" width="110" />
          <el-table-column prop="parkName" label="所属停车场" min-width="180" />
          <el-table-column prop="area" label="区域" width="100" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'free' ? 'success' : row.status === 'used' ? 'danger' : 'warning'" size="small">
                {{ row.status === 'free' ? '空闲' : row.status === 'used' ? '占用' : '预约' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="plate" label="占用车牌" width="120" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="primary" v-if="row.status === 'free'" @click="occupy(row)">分配</el-button>
              <el-popconfirm title="确认删除？" @confirm="handleDel(row)">
                <template #reference><el-button link type="danger">删除</el-button></template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-bar">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="grid">网格视图</el-radio-button>
          <el-radio-button value="list">列表视图</el-radio-button>
        </el-radio-group>
        <el-pagination
          v-model:current-page="page" v-model:page-size="size"
          :total="filtered.length" :page-sizes="[30, 60, 120]"
          :layout="viewMode === 'grid' ? 'prev, pager, next' : 'total, sizes, prev, pager, next'"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialog" :title="form.id ? '编辑车位' : '新增车位'" width="480" :close-on-click-modal="false">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="停车场" prop="parkId">
          <el-select v-model="form.parkId" placeholder="请选择停车场" style="width: 100%">
            <el-option v-for="p in parks" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车位编号" prop="id"><el-input v-model="form.id" placeholder="如 A-001" /></el-form-item>
        <el-form-item label="区域"><el-input v-model="form.area" placeholder="如 A区/B1层" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="普通车位" value="普通车位" />
            <el-option label="充电车位" value="充电车位" />
            <el-option label="无障碍车位" value="无障碍车位" />
            <el-option label="VIP车位" value="VIP车位" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="free">空闲</el-radio>
            <el-radio value="used">占用</el-radio>
            <el-radio value="reserved">预约</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.status !== 'free'" label="车牌"><el-input v-model="form.plate" placeholder="占用车牌" /></el-form-item>
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
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Place, Van, Clock } from '@element-plus/icons-vue'

const parks = ref([
  { id: 'P001', name: '国贸中心地下停车场' },
  { id: 'P002', name: '金融街A区停车场' },
  { id: 'P003', name: '科技园P1停车场' },
  { id: 'P004', name: '万象城购物中心' },
  { id: 'P005', name: '高铁站东广场' },
  { id: 'P012', name: '新能源超级充电场' }
])

const genSlots = () => {
  const areas = ['A', 'B', 'C', 'D']
  const arr: any[] = []
  parks.value.forEach(pk => {
    areas.forEach(a => {
      for (let i = 1; i <= 15; i++) {
        const status = Math.random() < 0.55 ? 'used' : Math.random() < 0.8 ? 'free' : 'reserved'
        const plate = status === 'used' ? ('京A' + Math.floor(Math.random() * 90000 + 10000)) : ''
        const type = ['普通车位', '普通车位', '普通车位', '充电车位', 'VIP车位'][Math.floor(Math.random() * 5)]
        arr.push({
          id: `${pk.id}-${a}${String(i).padStart(3, '0')}`,
          parkId: pk.id,
          parkName: pk.name,
          area: `${a}区`,
          type,
          status,
          plate
        })
      }
    })
  })
  return arr
}

const list = ref(genSlots())

const query = ref('')
const parkFilter = ref('')
const statusFilter = ref('')
const page = ref(1)
const size = ref(60)
const viewMode = ref<'grid' | 'list'>('grid')
const dialog = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ id: '', parkId: 'P001', parkName: '', area: 'A区', type: '普通车位', status: 'free', plate: '' })

const rules: FormRules = {
  id: [{ required: true, message: '请输入车位编号', trigger: 'blur' }],
  parkId: [{ required: true, message: '请选择停车场', trigger: 'change' }]
}

const filtered = computed(() => list.value.filter(r => {
  if (parkFilter.value && r.parkId !== parkFilter.value) return false
  if (statusFilter.value && r.status !== statusFilter.value) return false
  if (query.value && !r.id.includes(query.value) && !r.plate.includes(query.value)) return false
  return true
}))

const freeCount = computed(() => filtered.value.filter(r => r.status === 'free').length)
const usedCount = computed(() => filtered.value.filter(r => r.status === 'used').length)
const reservedCount = computed(() => filtered.value.filter(r => r.status === 'reserved').length)

const pagedList = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))

const onSearch = () => { page.value = 1 }

const resetForm = () => {
  Object.assign(form, { id: '', parkId: 'P001', parkName: '', area: 'A区', type: '普通车位', status: 'free', plate: '' })
}

const handleAdd = () => { resetForm(); dialog.value = true }
const handleEdit = (row: any) => {
  Object.assign(form, { ...row })
  dialog.value = true
}
const handleDel = (row: any) => {
  const i = list.value.findIndex(r => r.id === row.id)
  if (i > -1) list.value.splice(i, 1)
  ElMessage.success('删除成功')
}
const occupy = (row: any) => {
  const plate = prompt('请输入占用车牌（如 京A12345）', '京A' + Math.floor(Math.random() * 90000 + 10000))
  if (!plate) return
  row.status = 'used'
  row.plate = plate
  ElMessage.success('分配成功')
}
const handleClick = (row: any) => {
  ElMessage.info(`${row.id}：${row.status === 'free' ? '空闲' : row.status === 'used' ? `占用 ${row.plate}` : '预约'}`)
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    const park = parks.value.find(p => p.id === form.parkId)
    form.parkName = park?.name || ''
    if (form.id && list.value.some(r => r.id === form.id)) {
      const i = list.value.findIndex(r => r.id === form.id)
      if (i > -1) list.value.splice(i, 1, { ...form })
      ElMessage.success('编辑成功')
    } else {
      list.value.unshift({ ...form })
      ElMessage.success('新增成功')
    }
    dialog.value = false
  })
}
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; gap: 12px; }
.card { border-radius: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.grid-wrap { margin-top: 12px; }
.grid-head { display: flex; gap: 24px; margin-bottom: 8px; color: #606266; font-size: 13px; }
.grid-head .used { color: #F56C6C; }
.grid-head .reserved { color: #E6A23C; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.slot {
  background: #fff;
  border: 2px solid #67C23A;
  color: #67C23A;
  border-radius: 8px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.15s;
  user-select: none;
  &:hover { transform: translateY(-2px); }
  &.used { border-color: #F56C6C; color: #F56C6C; background: #fef0f0; }
  &.reserved { border-color: #E6A23C; color: #E6A23C; background: #fdf6ec; }
  .slot-id { font-weight: 600; font-size: 13px; }
  .slot-status { font-size: 22px; margin-top: 4px; }
  .plate { font-size: 13px; font-weight: 600; margin-top: 4px; color: #303133; }
}
.pagination-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 12px;
}
</style>
