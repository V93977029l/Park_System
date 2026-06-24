<template>
  <div class="user-page">
    <div class="toolbar">
      <el-input
        v-model="mobile"
        placeholder="请输入手机号查询"
        clearable
        style="width: 260px"
        :prefix-icon="Search"
        @keyup.enter="handlerQuery"
      />
      <el-button type="primary" :icon="Search" @click="handlerQuery">查询</el-button>
      <el-button type="success" :icon="Plus" @click="openAdd">添加</el-button>
    </div>

    <el-dialog
      v-model="dialogFormVisible"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :on-change="handleAvatarChange"
            accept="image/*"
            :auto-upload="false"
            drag
          >
            <el-image
              v-if="form.avatar"
              :src="form.avatar"
              style="width: 100px; height: 100px; border-radius: 50%"
              fit="cover"
            />
            <div v-else class="upload-placeholder">
              <el-icon class="el-icon--upload"><Plus /></el-icon>
              <div class="el-upload__text">点击上传头像</div>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名" prop="account">
          <el-input v-model="form.account" autocomplete="off" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="off" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.mail" autocomplete="off" placeholder="可选" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" autocomplete="off" maxlength="11" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-table :data="tableData.data.records" stripe border style="width: 100%; margin-top: 12px"
      :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }"
    >
      <el-table-column type="index" label="序号" width="70" align="center" />
      <el-table-column label="头像" width="90" align="center">
        <template #default="scope">
          <el-image
            v-if="scope.row.avatar"
            :src="scope.row.avatar"
            style="width: 48px; height: 48px; border-radius: 50%"
            fit="cover"
          />
          <el-icon v-else :size="36" color="#c0c4cc"><User /></el-icon>
        </template>
      </el-table-column>
      <el-table-column label="用户名" width="160" align="center">
        <template #default="scope">
          <el-link type="primary" @click="gotoUserAddRoles(scope.row.usersId)">{{ scope.row.account }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="password" label="密码" width="120" align="center" />
      <el-table-column prop="mail" label="邮箱" align="center" />
      <el-table-column prop="mobile" label="联系方式" width="150" align="center" />
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="scope">
          <el-button type="primary" :icon="Edit" circle @click="openEdit(scope.row)" />
          <el-popconfirm title="确认删除该用户？" @confirm="handleDelete(scope.$index, scope.row)">
            <template #reference>
              <el-button type="danger" :icon="Delete" circle />
            </template>
          </el-popconfirm>
          <el-button type="warning" :icon="UserFilled" circle @click="gotoUserAddRoles(scope.row.usersId)" />
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      class="pagination"
      layout="prev, pager, next"
      :total="tableData.data.total"
      :default-page-size="pageSize"
      @prev-click="prePage"
      @next-click="nextPage"
      @current-change="goto"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Delete, Edit, Search, Plus, UserFilled, User } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import router from '../../../router'
import avatar1 from '../../../assets/logo.jpg'
import avatar2 from '../../../assets/logo2.jpg'

interface UserRow {
  usersId?: number | string
  account: string
  password: string
  mail: string
  mobile: string
  avatar?: string
}

const pageNo = ref(1)
const pageSize = ref(10)
const isEdit = ref(false)
const mobile = ref('')
const dialogFormVisible = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<UserRow>({
  account: '',
  mobile: '',
  password: '',
  mail: '',
  avatar: ''
})

const formRules: FormRules = {
  account: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

interface PagePayload {
  code: number
  data: { records: UserRow[]; total: number }
  msg: string
}

const tableData = ref<PagePayload>({
  code: 0,
  data: { records: [], total: 0 },
  msg: ''
})

const handleAvatarChange = (file: UploadFile) => {
  if (!file.raw) return
  const reader = new FileReader()
  reader.onload = (e) => {
    form.avatar = String(e.target?.result || '')
  }
  reader.readAsDataURL(file.raw)
}

const resetForm = () => {
  form.usersId = undefined
  form.account = ''
  form.mobile = ''
  form.password = ''
  form.mail = ''
  form.avatar = ''
}

const openAdd = () => {
  isEdit.value = false
  resetForm()
  dialogFormVisible.value = true
}

const openEdit = async (row: UserRow) => {
  isEdit.value = true
  try {
    const result: any = await (window as any).__users?.queryUserById?.(row.usersId)
    if (result && result.code == 0) {
      Object.assign(form, result.data || row)
    } else {
      Object.assign(form, row)
    }
  } catch {
    Object.assign(form, row)
  }
  dialogFormVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (isEdit.value) {
      const idx = tableData.value.data.records.findIndex((r) => r.usersId === form.usersId)
      if (idx !== -1) {
        tableData.value.data.records[idx] = { ...tableData.value.data.records[idx], ...form }
      }
      ElMessage.success('修改成功')
    } else {
      const nextId = (tableData.value.data.records[tableData.value.data.records.length - 1]?.usersId as number || 0) + 1
      tableData.value.data.records.push({
        ...form,
        usersId: nextId
      })
      tableData.value.data.total++
      ElMessage.success('添加成功')
    }
    dialogFormVisible.value = false
  })
}

const handleDelete = async (index: number, row: UserRow) => {
  tableData.value.data.records.splice(index, 1)
  tableData.value.data.total = Math.max(0, tableData.value.data.total - 1)
  ElMessage.success(`已删除 ${row.account}`)
}

const gotoUserAddRoles = (usersId: number | string) => {
  router.push({ path: '/main/userAddRoles', query: { id: usersId } })
}

const handlerQuery = async () => {
  tableData.value = {
    code: 0,
    msg: '',
    data: {
      records: [
        { usersId: 1, account: 'admin', password: '******', mail: 'admin@demo.com', mobile: '13800138000', avatar: avatar1 },
        { usersId: 2, account: 'guest', password: '******', mail: 'guest@demo.com', mobile: '13900139000', avatar: avatar2 }
      ],
      total: 2
    }
  }
}

const prePage = () => {
  if (pageNo.value > 1) pageNo.value--
  handlerQuery()
}
const nextPage = () => {
  pageNo.value++
  handlerQuery()
}
const goto = (no: number) => {
  pageNo.value = no
  handlerQuery()
}

onMounted(() => {
  handlerQuery()
})
</script>

<style scoped lang="scss">
.user-page { padding: 8px; }
.toolbar { display: flex; gap: 10px; align-items: center; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }

.avatar-uploader :deep(.el-upload-dragger) {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #8c939d;
  font-size: 12px;
}
</style>
