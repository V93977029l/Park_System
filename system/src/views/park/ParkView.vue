<template>
  <div class="page">
    <el-card class="card" shadow="never">
      <div class="toolbar">
        <div class="search">
          <el-input v-model="query" placeholder="请输入停车场名称/地址" clearable style="width: 280px" @keyup.enter="onSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </div>
        <div class="btns">
          <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增停车场</el-button>
        </div>
      </div>

      <el-table :data="pagedList" border stripe style="margin-top: 12px">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="name" label="停车场名称" min-width="180" />
        <el-table-column prop="address" label="地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="total" label="总车位" width="90" />
        <el-table-column label="空闲" width="90">
          <template #default="{ row }">
            <span :style="{ color: (row.total - row.used) < 10 ? '#F56C6C' : '#67C23A' }">{{ row.total - row.used }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="used" label="已用" width="90" />
        <el-table-column prop="fee" label="首小时(元)" width="110" />
        <el-table-column prop="manager" label="负责人" width="110" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '运营中' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="handleViewSlot(row)">车位</el-button>
            <el-popconfirm title="确认删除该停车场？" @confirm="handleDel(row)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page" v-model:page-size="size"
        :total="filtered.length" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
        style="margin-top: 12px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="dialog" :title="form.id ? '编辑停车场' : '新增停车场'" width="520" :close-on-click-modal="false">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" placeholder="请输入停车场名称" /></el-form-item>
        <el-form-item label="地址" prop="address"><el-input v-model="form.address" placeholder="请输入详细地址" /></el-form-item>
        <el-form-item label="总车位" prop="total"><el-input-number v-model="form.total" :min="10" :max="10000" style="width: 100%" /></el-form-item>
        <el-form-item label="首小时收费" prop="fee"><el-input-number v-model="form.fee" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="后续收费" prop="extraFee"><el-input v-model="form.extraFee" placeholder="如 2元/30分钟" /></el-form-item>
        <el-form-item label="负责人" prop="manager"><el-input v-model="form.manager" placeholder="请输入负责人" /></el-form-item>
        <el-form-item label="联系电话" prop="phone"><el-input v-model="form.phone" placeholder="请输入联系电话" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="运营中">运营中</el-radio>
            <el-radio value="已停运">已停运</el-radio>
          </el-radio-group>
        </el-form-item>
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
import { Search, Plus } from '@element-plus/icons-vue'

const router = useRouter()

const list = ref([
  { id: 'P001', name: '国贸中心地下停车场', address: '北京市朝阳区建国门外大街1号', total: 680, used: 562, fee: 10, extraFee: '5元/30分钟', manager: '李明', phone: '13800001111', status: '运营中' },
  { id: 'P002', name: '金融街A区停车场', address: '北京市西城区金融街3号楼B1', total: 420, used: 398, fee: 8, extraFee: '4元/30分钟', manager: '王芳', phone: '13800002222', status: '运营中' },
  { id: 'P003', name: '科技园P1停车场', address: '北京市海淀区中关村科技园9号楼', total: 960, used: 710, fee: 6, extraFee: '3元/30分钟', manager: '张伟', phone: '13800003333', status: '运营中' },
  { id: 'P004', name: '万象城购物中心', address: '北京市朝阳区三里屯万象城B2', total: 880, used: 622, fee: 15, extraFee: '6元/30分钟', manager: '刘洋', phone: '13800004444', status: '运营中' },
  { id: 'P005', name: '高铁站东广场', address: '北京市丰台区北京南站东广场', total: 1200, used: 988, fee: 12, extraFee: '5元/30分钟', manager: '陈静', phone: '13800005555', status: '运营中' },
  { id: 'P006', name: '医院地面停车场', address: '北京市东城区协和医院正门', total: 260, used: 258, fee: 6, extraFee: '2元/30分钟', manager: '赵强', phone: '13800006666', status: '运营中' },
  { id: 'P007', name: '大学科技园', address: '北京市海淀区清华科技园C座', total: 520, used: 215, fee: 5, extraFee: '2元/30分钟', manager: '孙丽', phone: '13800007777', status: '运营中' },
  { id: 'P008', name: '小区P区', address: '北京市朝阳区望京SOHO P区', total: 380, used: 366, fee: 4, extraFee: '1.5元/30分钟', manager: '周伟', phone: '13800008888', status: '运营中' },
  { id: 'P009', name: '会展中心', address: '北京市朝阳区国家会议中心B2', total: 1500, used: 420, fee: 15, extraFee: '6元/30分钟', manager: '吴敏', phone: '13800009999', status: '运营中' },
  { id: 'P010', name: '机场T3停车场', address: '北京市大兴区大兴机场T3航站楼', total: 2000, used: 1620, fee: 20, extraFee: '10元/30分钟', manager: '郑凯', phone: '13800001010', status: '运营中' },
  { id: 'P011', name: '老城区政府停车场', address: '北京市西城区府右街10号', total: 160, used: 0, fee: 5, extraFee: '2元/30分钟', manager: '黄辉', phone: '13800001100', status: '已停运' },
  { id: 'P012', name: '新能源超级充电场', address: '北京市通州区运河CBD 5号楼', total: 640, used: 188, fee: 8, extraFee: '含充电服务费', manager: '高峰', phone: '13800001200', status: '运营中' }
])

const query = ref('')
const page = ref(1)
const size = ref(10)
const dialog = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ id: '', name: '', address: '', total: 300, used: 0, fee: 8, extraFee: '', manager: '', phone: '', status: '运营中' })

const rules: FormRules = {
  name: [{ required: true, message: '请输入停车场名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  total: [{ required: true, message: '请输入总车位', trigger: 'change' }],
  fee: [{ required: true, message: '请输入首小时收费', trigger: 'change' }],
  manager: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
}

const filtered = computed(() => list.value.filter(r => !query.value || r.name.includes(query.value) || r.address.includes(query.value)))
const pagedList = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))

const onSearch = () => { page.value = 1 }

const resetForm = () => {
  Object.assign(form, { id: '', name: '', address: '', total: 300, used: 0, fee: 8, extraFee: '', manager: '', phone: '', status: '运营中' })
}

const handleAdd = () => { resetForm(); dialog.value = true }
const handleEdit = (row: any) => { Object.assign(form, { ...row }); dialog.value = true }
const handleDel = (row: any) => {
  const i = list.value.findIndex(r => r.id === row.id)
  if (i > -1) list.value.splice(i, 1)
  ElMessage.success('删除成功')
}
const handleViewSlot = (row: any) => {
  router.push({ path: '/main/slots', query: { parkId: row.id, parkName: row.name } })
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    if (form.id) {
      const i = list.value.findIndex(r => r.id === form.id)
      if (i > -1) list.value.splice(i, 1, { ...form })
      ElMessage.success('编辑成功')
    } else {
      form.id = 'P' + String(list.value.length + 1).padStart(3, '0')
      form.used = 0
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
</style>
