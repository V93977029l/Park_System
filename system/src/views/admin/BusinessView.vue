<template>
  <div class="business-page">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="请输入商户名称/手机号查询"
        clearable
        style="width: 280px"
        :prefix-icon="Search"
        @keyup.enter="handlerQuery"
      />
      <el-button type="primary" :icon="Search" @click="handlerQuery">查询</el-button>
      <el-button type="success" :icon="Plus" @click="openAdd">新增商户</el-button>
    </div>

    <el-table
      :data="tableData"
      stripe
      border
      style="width: 100%; margin-top: 12px"
      :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }"
    >
      <el-table-column type="index" label="序号" width="70" align="center" />
      <el-table-column label="Logo" width="100" align="center">
        <template #default="scope">
          <el-image
            v-if="scope.row.logo"
            :src="scope.row.logo"
            style="width: 60px; height: 60px; border-radius: 8px"
            fit="cover"
          />
          <span v-else style="color: #c0c4cc">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="shopName" label="商户名称" align="center" />
      <el-table-column prop="contact" label="联系人" align="center" />
      <el-table-column prop="mobile" label="联系电话" align="center" />
      <el-table-column prop="address" label="地址" align="center" />
      <el-table-column prop="status" label="状态" align="center" width="110">
        <template #default="scope">
          <el-tag :type="scope.row.status === '营业中' ? 'success' : 'info'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="入驻时间" align="center" width="170" />
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button link type="primary" @click="toggleStatus(scope.row)">
            {{ scope.row.status === '营业中' ? '停业' : '开业' }}
          </el-button>
          <el-popconfirm title="确认删除该商户？" @confirm="handleDelete(scope.$index, scope.row)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pageNo"
      v-model:page-size="pageSize"
      class="pagination"
      background
      layout="total, prev, pager, next, jumper"
      :total="total"
      :page-sizes="[10, 20, 50]"
      @current-change="handlerQuery"
      @size-change="handlerQuery"
    />

    <el-dialog
      v-model="dialogFormVisible"
      :title="isEdit ? '编辑商户' : '新增商户'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="商户Logo">
          <el-upload
            class="logo-uploader"
            :show-file-list="false"
            :on-change="handleLogoChange"
            accept="image/*"
            :auto-upload="false"
            drag
          >
            <el-image
              v-if="form.logo"
              :src="form.logo"
              style="width: 120px; height: 120px; border-radius: 8px"
              fit="cover"
            />
            <div v-else class="upload-placeholder">
              <el-icon class="el-icon--upload"><Plus /></el-icon>
              <div class="el-upload__text">点击或拖拽上传Logo</div>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="商户名称" prop="shopName">
          <el-input v-model="form.shopName" placeholder="请输入商户名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="mobile">
          <el-input v-model="form.mobile" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import logoDemo from '../../assets/logo.jpg'
import logoDemo2 from '../../assets/logo2.jpg'

interface BusinessRow {
  shopId?: number
  shopName: string
  contact: string
  mobile: string
  address: string
  status: string
  createTime: string
  logo: string
}

const keyword = ref('')
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(2)

const dialogFormVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<BusinessRow>({
  shopId: undefined,
  shopName: '',
  contact: '',
  mobile: '',
  address: '',
  status: '营业中',
  createTime: '',
  logo: ''
})

const mockData: BusinessRow[] = [
  { shopId: 1, shopName: '山海民宿', contact: '张三', mobile: '13800138000', address: '青岛市市南区', status: '营业中', createTime: '2025-03-12 10:30:00', logo: logoDemo },
  { shopId: 2, shopName: '湖畔小屋', contact: '李四', mobile: '13900139000', address: '杭州市西湖区', status: '停业', createTime: '2025-05-08 14:22:00', logo: logoDemo2 }
]

const tableData = ref<BusinessRow[]>([])

const formRules: FormRules = {
  shopName: [{ required: true, message: '请输入商户名称', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  mobile: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

const handleLogoChange = (file: UploadFile) => {
  if (!file.raw) return
  const reader = new FileReader()
  reader.onload = (e) => {
    form.logo = String(e.target?.result || '')
  }
  reader.readAsDataURL(file.raw)
}

const resetForm = () => {
  form.shopId = undefined
  form.shopName = ''
  form.contact = ''
  form.mobile = ''
  form.address = ''
  form.status = '营业中'
  form.createTime = ''
  form.logo = ''
}

const loadMock = () => {
  tableData.value = mockData.slice()
  total.value = mockData.length
}

const handlerQuery = () => {
  const kw = keyword.value.trim()
  if (!kw) {
    loadMock()
    return
  }
  tableData.value = mockData.filter(
    (r) => r.shopName.includes(kw) || r.mobile.includes(kw)
  )
  total.value = tableData.value.length
}

const openAdd = () => {
  isEdit.value = false
  resetForm()
  dialogFormVisible.value = true
}

const openEdit = (row: BusinessRow) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogFormVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    if (isEdit.value) {
      const idx = tableData.value.findIndex((r) => r.shopId === form.shopId)
      if (idx !== -1) {
        tableData.value[idx] = { ...tableData.value[idx], ...form }
      }
      ElMessage.success('修改成功')
    } else {
      const nextId = (tableData.value[tableData.value.length - 1]?.shopId || 0) + 1
      tableData.value.push({
        ...form,
        shopId: nextId,
        createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      })
      total.value = tableData.value.length
      ElMessage.success('新增成功')
    }
    dialogFormVisible.value = false
  })
}

const toggleStatus = (row: BusinessRow) => {
  row.status = row.status === '营业中' ? '停业' : '营业中'
  ElMessage.success('状态已更新')
}

const handleDelete = (index: number, row: BusinessRow) => {
  tableData.value.splice(index, 1)
  total.value = tableData.value.length
  ElMessage.success(`已删除 ${row.shopName}`)
}

onMounted(() => {
  loadMock()
})
</script>

<style scoped lang="scss">
.business-page { padding: 8px; }
.toolbar { display: flex; gap: 10px; align-items: center; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }

.logo-uploader :deep(.el-upload-dragger) {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #8c939d;
  font-size: 12px;
}
</style>
