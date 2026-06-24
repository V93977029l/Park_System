<template>
  <div class="room-page">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="请输入房间地址/类型查询"
        clearable
        style="width: 280px"
        :prefix-icon="Search"
        @keyup.enter="handlerQuery"
      />
      <el-button type="primary" :icon="Search" @click="handlerQuery">查询</el-button>
      <el-button type="success" :icon="Plus" @click="openAdd">新增房间</el-button>
    </div>

    <el-table
      :data="tableData"
      stripe
      border
      style="width: 100%; margin-top: 12px"
      :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="picture" label="图片" width="100" align="center">
        <template #default="scope">
          <el-image
            v-if="scope.row.picture"
            :src="scope.row.picture"
            :preview-src-list="[scope.row.picture]"
            style="width: 72px; height: 72px; border-radius: 4px"
            fit="cover"
          />
          <span v-else style="color:#c0c4cc">暂无</span>
        </template>
      </el-table-column>
      <el-table-column prop="roomType" label="类型" width="90" align="center" />
      <el-table-column prop="address" label="地址" align="center" show-overflow-tooltip />
      <el-table-column prop="defaultPrice" label="日常价" width="100" align="center" />
      <el-table-column prop="holidayPrice" label="节假日价" width="110" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '空房' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="city" label="城市" width="80" align="center" />
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button link type="primary" @click="toggleStatus(scope.row)">
            {{ scope.row.status === '空房' ? '已出租' : '空房' }}
          </el-button>
          <el-popconfirm title="确认删除该房间？" @confirm="handleDelete(scope.$index, scope.row)">
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
      :title="isEdit ? '编辑房间' : '新增房间'"
      width="620px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="110px"
        label-position="right"
      >
        <el-form-item label="房间图片">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :action="uploadUrl"
          >
            <el-image
              v-if="form.picture"
              :src="form.picture"
              style="width: 178px; height: 178px; border-radius: 6px"
              fit="cover"
            />
            <div v-else class="upload-placeholder">
              <el-icon :size="24"><Plus /></el-icon>
              <div class="el-upload__text">上传图片</div>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="房间类型" prop="roomType">
          <el-select v-model="form.roomType" placeholder="请选择房间类型" style="width: 100%">
            <el-option label="公寓" value="公寓" />
            <el-option label="别墅" value="别墅" />
            <el-option label="平层" value="平层" />
            <el-option label="海景房" value="海景房" />
            <el-option label="lofter" value="lofter" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="介绍">
          <el-input v-model="form.desp" type="textarea" :rows="2" placeholder="房间介绍" />
        </el-form-item>
        <el-form-item label="日常价格" prop="defaultPrice">
          <el-input v-model="form.defaultPrice" placeholder="例：150.0" />
        </el-form-item>
        <el-form-item label="节假日价格">
          <el-input v-model="form.holidayPrice" placeholder="例：260.0" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="form.city" placeholder="例：青岛" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="空房" value="空房" />
            <el-option label="已出租" value="已出租" />
          </el-select>
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
import { ElMessage, type FormInstance, type FormRules, type UploadProps } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import roomImg1 from '../../../assets/room.jpg'
import roomImg2 from '../../../assets/room2.jpg'
import roomImg3 from '../../../assets/room3.jpg'
import roomImg4 from '../../../assets/room4.jpg'
import roomImg5 from '../../../assets/room5.jpg'
import roomNew1 from '../../../assets/room1.jpg'
import roomNew2 from '../../../assets/room_business.jpg'

interface RoomRow {
  roomId?: number
  picture: string
  roomType: string
  address: string
  desp: string
  defaultPrice: string
  holidayPrice: string
  content?: string
  status: string
  city: string
  lng?: string
  lat?: string
  code?: string
}

const keyword = ref('')
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(2)
const dialogFormVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const uploadUrl = ref('https://httpbin.org/post')

const form = reactive<RoomRow>({
  roomId: undefined,
  picture: '',
  roomType: '',
  address: '',
  desp: '',
  defaultPrice: '',
  holidayPrice: '',
  status: '空房',
  city: ''
})

const mockData: RoomRow[] = [
  {
    roomId: 1,
    picture: roomImg1,
    roomType: '公寓',
    address: '辽宁省大连市甘井子区华录园',
    desp: '整套88㎡，3卧1厅1厨1卫，可住6人',
    defaultPrice: '150.0',
    holidayPrice: '260.0',
    status: '空房',
    city: '大连'
  },
  {
    roomId: 2,
    picture: roomImg2,
    roomType: '海景房',
    address: '山东省青岛市黄岛区金沙滩',
    desp: '一线海景，120㎡复式，落地窗观景',
    defaultPrice: '380.0',
    holidayPrice: '680.0',
    status: '已出租',
    city: '青岛'
  },
  {
    roomId: 3,
    picture: roomImg3,
    roomType: '民宿小院',
    address: '浙江省杭州市西湖区龙井村',
    desp: '西湖龙井村中独栋小院，禅意装修',
    defaultPrice: '288.0',
    holidayPrice: '488.0',
    status: '空房',
    city: '杭州'
  },
  {
    roomId: 4,
    picture: roomNew1,
    roomType: '树屋',
    address: '云南省丽江市古城区束河古镇',
    desp: '束河古镇内特色树屋，纳西风情',
    defaultPrice: '320.0',
    holidayPrice: '560.0',
    status: '空房',
    city: '丽江'
  },
  {
    roomId: 5,
    picture: roomNew2,
    roomType: '北欧风',
    address: '四川省成都市锦江区太古里',
    desp: '市中心落地窗公寓，北欧极简装修',
    defaultPrice: '228.0',
    holidayPrice: '388.0',
    status: '已出租',
    city: '成都'
  }
]

const tableData = ref<RoomRow[]>([])

const formRules: FormRules = {
  roomType: [{ required: true, message: '请选择房间类型', trigger: 'change' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  defaultPrice: [{ required: true, message: '请输入日常价格', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const resetForm = () => {
  form.roomId = undefined
  form.picture = ''
  form.roomType = ''
  form.address = ''
  form.desp = ''
  form.defaultPrice = ''
  form.holidayPrice = ''
  form.status = '空房'
  form.city = ''
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
    (r) => r.address.includes(kw) || r.roomType.includes(kw)
  )
  total.value = tableData.value.length
}

const openAdd = () => {
  isEdit.value = false
  resetForm()
  dialogFormVisible.value = true
}

const openEdit = (row: RoomRow) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogFormVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    if (isEdit.value) {
      const idx = tableData.value.findIndex((r) => r.roomId === form.roomId)
      if (idx !== -1) {
        tableData.value[idx] = { ...tableData.value[idx], ...form }
      }
      ElMessage.success('修改成功')
    } else {
      const nextId = (tableData.value[tableData.value.length - 1]?.roomId || 0) + 1
      tableData.value.push({
        ...form,
        roomId: nextId
      })
      total.value = tableData.value.length
      ElMessage.success('新增成功')
    }
    dialogFormVisible.value = false
  })
}

const toggleStatus = (row: RoomRow) => {
  row.status = row.status === '空房' ? '已出租' : '空房'
  ElMessage.success('状态已更新')
}

const handleDelete = (index: number, row: RoomRow) => {
  tableData.value.splice(index, 1)
  total.value = tableData.value.length
  ElMessage.success(`已删除 ${row.address}`)
}

const handleAvatarSuccess: UploadProps['onSuccess'] = () => {
  ElMessage.success('图片上传成功（演示）')
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片不能超过 5MB！')
    return false
  }
  form.picture = URL.createObjectURL(file.raw as File)
  return false
}

onMounted(() => {
  loadMock()
})
</script>

<style scoped lang="scss">
.room-page {
  padding: 8px;
}

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

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: border-color 0.2s;
  &:hover {
    border-color: var(--el-color-primary);
  }
}

.upload-placeholder {
  width: 178px;
  height: 178px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>

<style>
html, body, #app { margin: 0; padding: 0; height: 100%; }
</style>