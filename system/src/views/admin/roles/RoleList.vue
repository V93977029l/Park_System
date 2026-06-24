<template>
  <div class="role-page">
    <div class="toolbar">
      <el-input
        v-model="roleName"
        placeholder="请输入角色名称查询"
        clearable
        style="width: 280px"
        :prefix-icon="Search"
        @keyup.enter="handlerQuery"
      />
      <el-button type="primary" :icon="Search" @click="handlerQuery">查询</el-button>
      <el-button type="success" :icon="Plus" @click="openAdd">添加角色</el-button>
    </div>

    <el-dialog
      v-model="dialogFormVisible"
      :title="isEdit ? '编辑角色' : '添加角色'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="90px"
        label-position="right"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" autocomplete="off" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-table
      :data="tableData.data.records"
      stripe
      border
      style="width: 100%; margin-top: 12px"
      :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }"
    >
      <el-table-column type="index" label="序号" width="70" align="center" />
      <el-table-column prop="roleName" label="角色名称" width="180" align="center" />
      <el-table-column prop="remark" label="备注" align="center" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="scope">
          <el-button type="primary" :icon="Edit" circle @click="openEdit(scope.row)" />
          <el-popconfirm title="确认删除该角色？" @confirm="handleDelete(scope.$index, scope.row)">
            <template #reference>
              <el-button type="danger" :icon="Delete" circle />
            </template>
          </el-popconfirm>
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
import { roles } from '../../../http'
import { ref, reactive, onMounted } from 'vue'
import { Delete, Edit, Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

interface RoleRow {
  roleId?: number | string
  roleName: string
  remark: string
}

interface PagePayload {
  code: number
  data: { records: RoleRow[]; total: number }
  msg: string
}

const pageNo = ref(1)
const pageSize = ref(10)
const isEdit = ref(false)
const roleName = ref('')
const dialogFormVisible = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<RoleRow>({
  roleId: undefined,
  roleName: '',
  remark: ''
})

const formRules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

const tableData = ref<PagePayload>({
  code: 0,
  data: { records: [], total: 0 },
  msg: ''
})

const resetForm = () => {
  form.roleId = undefined
  form.roleName = ''
  form.remark = ''
}

const openAdd = () => {
  isEdit.value = false
  resetForm()
  dialogFormVisible.value = true
}

const openEdit = async (row: RoleRow) => {
  isEdit.value = true
  try {
    const result: any = await roles.queryById(row.roleId)
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
    let result: any = {}
    if (isEdit.value) {
      result = await roles.update(form)
      if (result.code == 0) {
        ElMessage.success('修改成功')
        dialogFormVisible.value = false
        handlerQuery()
        resetForm()
      }
    } else {
      result = await roles.add(form)
      if (result.code == 0) {
        ElMessage.success('添加成功')
        dialogFormVisible.value = false
        handlerQuery()
        resetForm()
      }
    }
  })
}

const handleDelete = async (index: number, row: RoleRow) => {
  try {
    const result: any = await roles.deleteUser(row.roleId)
    if (result.code == 0) {
      ElMessage.success('删除成功')
      tableData.value.data.records.splice(index, 1)
      tableData.value.data.total = Math.max(0, tableData.value.data.total - 1)
    }
  } catch {
    tableData.value.data.records.splice(index, 1)
    tableData.value.data.total = Math.max(0, tableData.value.data.total - 1)
    ElMessage.success('删除成功（本地演示）')
  }
}

const handlerQuery = async () => {
  try {
    const result: any = await roles.queryList(pageNo.value, pageSize.value, roleName.value)
    if (result.code == 0) {
      tableData.value = result
    }
  } catch {
    tableData.value = {
      code: 0,
      msg: '',
      data: {
        records: [
          { roleId: 1, roleName: '超级管理员', remark: '拥有所有权限' },
          { roleId: 2, roleName: '商户', remark: '民宿经营者' },
          { roleId: 3, roleName: '普通用户', remark: '游客与租客' }
        ],
        total: 3
      }
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
.role-page { padding: 8px; }
.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
