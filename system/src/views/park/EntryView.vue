<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card class="card" shadow="never">
          <el-tabs v-model="cameraTab" class="camera-tabs">
            <el-tab-pane label="车牌识别" name="rec">
              <template #label><span>📷 车牌识别</span></template>
            </el-tab-pane>
            <el-tab-pane label="人工登记" name="manual">
              <template #label><span>✍️ 人工登记</span></template>
            </el-tab-pane>
            <el-tab-pane label="月卡自助" name="vip">
              <template #label><span>💳 月卡自助</span></template>
            </el-tab-pane>
          </el-tabs>

          <div class="camera-head">
            <span class="name">入口 A01 · 在线</span>
            <span class="dot dot-green"></span>
          </div>

          <div class="vehicle-camera">
            <div class="scan-line"></div>
            <div class="live">
              <div class="bulb">REC</div>
              <span>LIVE</span>
            </div>
          </div>

          <el-progress class="progress-mt" :percentage="confidence" :stroke-width="16" :show-text="true"
            :format="() => `识别置信度  ${confidence}%`" />

          <el-alert class="alert-mt" :title="`识别到车牌：${recognizedPlate}`" type="success" :closable="false" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="card" shadow="never">
          <template #header><span class="card-title">入场信息确认</span></template>
          <el-form :model="form" :rules="rules" ref="formRef" label-width="90px" size="large">
            <el-form-item label="车牌号" prop="plate">
              <el-input v-model="form.plate" placeholder="自动识别，可编辑" maxlength="9" />
            </el-form-item>
            <el-form-item label="车辆类型">
              <el-select v-model="form.type" style="width: 100%">
                <el-option label="普通" value="普通" />
                <el-option label="新能源" value="新能源" />
                <el-option label="VIP" value="VIP" />
              </el-select>
            </el-form-item>
            <el-form-item label="入场入口" prop="entry">
              <el-select v-model="form.entry" style="width: 100%">
                <el-option v-for="e in entries" :key="e" :label="e" :value="e" />
              </el-select>
            </el-form-item>
            <el-form-item label="停车场">
              <el-select v-model="form.park" style="width: 100%">
                <el-option v-for="p in parks" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
            <el-form-item label="泊位区域">
              <el-select v-model="form.area" style="width: 100%">
                <el-option v-for="a in areas" :key="a" :label="a" :value="a" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作员">
              <el-select v-model="form.operator" style="width: 100%">
                <el-option v-for="o in operators" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
            <el-form-item label="月卡">
              <el-switch v-model="form.isVip" active-text="是" inactive-text="否" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" class="btn-go-in" :loading="loading" @click="submit">🚦 开闸入场</el-button>
              <el-button size="large" @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="card" shadow="never">
          <template #header>
            <div class="header-row">
              <span class="card-title">今日入场（今日 已入场 {{ enterTotal }} / 限 2000）</span>
              <el-input v-model="search" placeholder="按车牌搜索" clearable size="default" style="width: 180px" />
            </div>
          </template>

          <el-table :data="filteredList" stripe size="default" max-height="420">
            <el-table-column prop="plate" label="车牌" width="110" />
            <el-table-column prop="type" label="类型" width="70" />
            <el-table-column prop="entry" label="入口" width="80" />
            <el-table-column prop="operator" label="操作员" width="80" />
            <el-table-column prop="time" label="时间" width="120" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.status === '放行'" type="success" size="small">放行</el-tag>
                <el-tag v-else type="danger" size="small">拦截</el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="stat-row">
            <div class="stat-cell"><div class="num">{{ passCount }}</div><div class="lbl">今日放行</div></div>
            <div class="stat-cell"><div class="num danger">{{ blockCount }}</div><div class="lbl">今日拦截</div></div>
            <div class="stat-cell"><div class="num warn">{{ vipCount }}</div><div class="lbl">月卡入场</div></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const entries = ['A01', 'A02', 'B01', 'B02']
const parks = ['国贸中心', '金融街A区', '科技园P1', '万象城', '高铁站']
const areas = ['A区', 'B区', 'C区', 'VIP区']
const operators = ['自动', '王静', '刘强', '系统']

const prefix = ['京A', '京B', '京C']
const tail = ['12345', '67890', '88888', 'A8888', '10000']
const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
const plateSeed = (i: number) => prefix[i % 3] + tail[i % 5]

const makeTime = (offsetMin: number) => {
  const d = new Date(Date.now() - offsetMin * 60000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const mockList = (count: number) => Array.from({ length: count }).map((_, i) => {
  const isPass = Math.random() > 0.04
  const isVip = i % 33 === 0 || (Math.random() > 0.9)
  return {
    plate: plateSeed(i),
    type: isVip ? 'VIP' : rand(['普通', '新能源', '普通', '普通']),
    entry: rand(entries),
    operator: isPass ? rand(operators) : '系统',
    time: makeTime(i * 12 + 5),
    status: isPass ? '放行' : '拦截',
    isVip
  }
})

const cameraTab = ref('rec')
const recognizedPlate = ref('京A·88888')
const confidence = ref(87)

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({
  plate: '京A·88888',
  type: '普通',
  entry: 'A01',
  park: '国贸中心',
  area: 'A区',
  operator: '自动',
  isVip: false
})

const rules: FormRules = {
  plate: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  entry: [{ required: true, message: '请选择入场入口', trigger: 'change' }]
}

const search = ref('')
const allList = ref<any[]>([])

const filteredList = computed(() => {
  if (!search.value) return allList.value
  const kw = search.value.trim().toLowerCase()
  return allList.value.filter(x => x.plate.toLowerCase().includes(kw))
})

const passCount = computed(() => allList.value.filter(x => x.status === '放行').length)
const blockCount = computed(() => allList.value.filter(x => x.status === '拦截').length)
const vipCount = computed(() => allList.value.filter(x => x.isVip).length)
const enterTotal = computed(() => allList.value.length)

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    loading.value = true
    try {
      const isPass = Math.random() > 0.03
      allList.value.unshift({
        plate: form.plate.replace('·', ''),
        type: form.type,
        entry: form.entry,
        operator: form.operator,
        time: makeTime(0),
        status: isPass ? '放行' : '拦截',
        isVip: form.isVip
      })
      if (isPass) {
        ElMessage.success(`开闸成功！放行 ${form.plate}`)
      } else {
        ElMessage.warning(`车牌 ${form.plate} 存在重复记录，需人工审核`)
      }
    } finally {
      loading.value = false
    }
  })
}

const resetForm = () => {
  Object.assign(form, {
    plate: recognizedPlate.value, type: '普通',
    entry: 'A01', park: '国贸中心', area: 'A区', operator: '自动', isVip: false
  })
  confidence.value = 87
}

const tick = () => {
  const base = 75 + Math.floor(Math.random() * 20)
  confidence.value = base
  recognizedPlate.value = rand(prefix) + '·' + rand(tail)
  form.plate = recognizedPlate.value
}

let timer: any = null

onMounted(() => {
  allList.value = mockList(30)
  timer = window.setInterval(tick, 4200)
})

onBeforeUnmount(() => { if (timer) window.clearInterval(timer) })
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; gap: 12px; padding: 12px 0; }
.card { border-radius: 10px; }
.card-title { font-weight: 600; color: #303133; font-size: 15px; }
.header-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }

.camera-tabs { margin-bottom: 4px; }
.camera-head { display: flex; justify-content: space-between; align-items: center; margin: 6px 4px 8px;
  .name { font-weight: 600; color: #303133; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .dot-green { background: #67c23a; box-shadow: 0 0 6px #67c23a; }
}

.vehicle-camera {
  position: relative; width: 100%; height: 220px;
  background: linear-gradient(180deg, #0a2463 0%, #1e3a8a 100%);
  border-radius: 10px; overflow: hidden; box-shadow: inset 0 0 24px rgba(0,0,0,.4);
  &::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image:
      radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
      radial-gradient(rgba(0,255,136,.04) 1px, transparent 1px);
    background-size: 12px 12px, 22px 22px;
    mix-blend-mode: screen; opacity: .6;
  }
  .scan-line {
    position: absolute; left: 0; right: 0; top: 0;
    height: 3px; background: #00ff88; opacity: .9;
    box-shadow: 0 0 14px #00ff88, 0 0 28px #00ff88;
    animation: scan 2.5s linear infinite;
  }
  .live {
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    text-align: center; color: #fff;
    .bulb {
      width: 74px; height: 74px; border-radius: 50%;
      background: radial-gradient(circle, #ff4d4f 0%, #b8001f 100%);
      box-shadow: 0 0 30px #ff4d4f, inset 0 -8px 12px rgba(0,0,0,.3);
      font-size: 22px; font-weight: 900; color: #fff; letter-spacing: 2px;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 6px;
    }
    span { display: inline-block; letter-spacing: 6px; font-size: 12px;
      background: rgba(0,0,0,.35); padding: 2px 12px; border-radius: 4px; }
  }
}

@keyframes scan { from { top: 0; } to { top: 100%; } }

.progress-mt { margin-top: 12px; }
.alert-mt { margin-top: 10px; }

.btn-go-in { min-width: 140px; }

.stat-row {
  display: flex; justify-content: space-between; margin-top: 14px; padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  .stat-cell { text-align: center; flex: 1; }
  .num { font-size: 28px; font-weight: 700; color: #409eff; }
  .num.danger { color: #f56c6c; }
  .num.warn { color: #e6a23c; }
  .lbl { color: #909399; font-size: 12px; margin-top: 2px; }
}
</style>
