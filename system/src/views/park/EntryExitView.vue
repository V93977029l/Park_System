<template>
  <div class="page">
    <div class="card page__card">
      <div class="page__head">
        <div class="page__head-left">
          <div class="page__head-sub">FLOW · 车辆通行</div>
          <div class="page__head-main">车辆出入厂</div>
        </div>
        <div class="page__head-right">
          <div class="quick-pill"><el-icon><Position /></el-icon><span>今日通行</span><b>{{ stats.entry + stats.exit }}</b></div>
          <div class="quick-pill"><el-icon><Promotion /></el-icon><span>入场</span><b class="accent">{{ stats.entry }}</b></div>
          <div class="quick-pill"><el-icon><Aim /></el-icon><span>出场</span><b>{{ stats.exit }}</b></div>
        </div>
      </div>

      <div class="tab-switch">
        <button class="tab-switch__btn" :class="{ 'is-active': activeTab === 'entry' }" @click="activeTab = 'entry'">
          <el-icon><Promotion /></el-icon><span>车辆入场登记</span>
          <span class="tab-switch__count">{{ entryRecs.length }}</span>
        </button>
        <button class="tab-switch__btn" :class="{ 'is-active': activeTab === 'exit' }" @click="activeTab = 'exit'">
          <el-icon><Aim /></el-icon><span>车辆出场结算</span>
          <span class="tab-switch__count">{{ exitRecs.length }}</span>
        </button>
      </div>

      <div class="tab-panel" v-show="activeTab === 'entry'">
        <div class="tab-panel__grid">
          <div class="card card--lite">
            <div class="card-title">入场登记</div>
            <el-form label-width="84px" label-position="right" :model="entryForm" :rules="entryRules" ref="entryFormRef">
              <el-form-item label="车牌" prop="plate"><el-input v-model="entryForm.plate" placeholder="如 京A88888" maxlength="12" /></el-form-item>
              <el-form-item label="停车场" prop="park">
                <el-select v-model="entryForm.park" style="width:100%;">
                  <el-option v-for="p in parkList" :key="p" :label="p" :value="p" />
                </el-select>
              </el-form-item>
              <el-form-item label="车位"><el-input v-model="entryForm.slot" placeholder="如 A-03-12" /></el-form-item>
              <el-form-item label="类型">
                <el-radio-group v-model="entryForm.type">
                  <el-radio value="小型车">小型</el-radio>
                  <el-radio value="中型车">中型</el-radio>
                  <el-radio value="大型车">大型</el-radio>
                  <el-radio value="新能源">新能源</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="入场时间"><el-time-picker v-model="entryForm.time" value-format="HH:mm" format="HH:mm" /></el-form-item>
              <el-form-item label="操作员"><el-input v-model="entryForm.operator" /></el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="submitting" @click="submitEntry"><el-icon><Promotion /></el-icon><span>登记入场</span></el-button>
                <el-button @click="resetEntry">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          <div class="card card--lite">
            <div class="card-title">入场摄像头</div>
            <div class="camera"><div class="camera__scanner"/><div class="camera__live">REC · LIVE</div><div class="camera__plate">识别车牌：<b>{{ entryForm.plate || '—' }}</b></div></div>
            <el-progress :percentage="86" :stroke-width="14" :format="() => '置信度 86%'" style="margin-top:12px;"/>
            <el-alert type="success" :closable="false" style="margin-top:10px;" title="已接入 P01-A01 出入口，车牌识别正常" />
            <el-alert type="info" :closable="false" style="margin-top:8px;" title="补录请使用右侧登记表单" />
          </div>
        </div>
        <el-card class="card card--lite" style="margin-top:16px;">
          <template #header><div class="card-title-row"><span>今日入场记录</span><span class="muted">共 {{ entryRecs.length }} 条</span></div></template>
          <el-table :data="entryRecs" stripe size="default">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="plate" label="车牌" width="130" />
            <el-table-column prop="park"  label="停车场" />
            <el-table-column prop="slot"  label="车位" width="110" />
            <el-table-column prop="type"  label="类型" width="90" />
            <el-table-column prop="time"  label="入场时间" width="160" />
            <el-table-column prop="operator" label="操作员" width="110" />
          </el-table>
        </el-card>
      </div>

      <div class="tab-panel" v-show="activeTab === 'exit'">
        <div class="card card--lite">
          <div class="card-title-row"><span>出场车辆结算</span><el-input v-model="exitFilter" placeholder="按车牌筛选" clearable style="width:220px;" /></div>
          <el-table :data="filteredExit" stripe>
            <el-table-column prop="plate" label="车牌" width="130" />
            <el-table-column prop="park"  label="停车场" />
            <el-table-column prop="slot"  label="车位" width="110" />
            <el-table-column prop="type"  label="类型" width="90" />
            <el-table-column prop="inTime" label="入场时间" width="160" />
            <el-table-column label="停车时长" width="110"><template #default="{row}"><el-tag size="small" type="info">{{ row.duration }}</el-tag></template></el-table-column>
            <el-table-column label="应付" width="130"><template #default="{row}"><b class="money">¥{{ row.amount }}</b></template></el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{row}">
                <el-button size="small" type="primary" @click="settle(row)"><el-icon><Wallet /></el-icon><span>结算</span></el-button>
                <el-button size="small" @click="showBill(row)">明细</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-dialog v-model="billDialog" title="费用明细" width="520px">
          <div v-if="billRow">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="车牌">{{ billRow.plate }}</el-descriptions-item>
              <el-descriptions-item label="停车场">{{ billRow.park }}</el-descriptions-item>
              <el-descriptions-item label="车位">{{ billRow.slot }}</el-descriptions-item>
              <el-descriptions-item label="入场时间">{{ billRow.inTime }}</el-descriptions-item>
              <el-descriptions-item label="出场时间">{{ billRow.outTime }}</el-descriptions-item>
              <el-descriptions-item label="停车时长">{{ billRow.duration }}</el-descriptions-item>
              <el-descriptions-item label="计费标准">{{ billRow.type === '新能源' ? '¥3/小时 (首时免费)' : '¥4/小时 · 首30分钟免费' }}</el-descriptions-item>
              <el-descriptions-item label="优惠">{{ billRow.voucher || '无' }}</el-descriptions-item>
              <el-descriptions-item label="应付"><b class="money">¥{{ billRow.amount }}</b></el-descriptions-item>
            </el-descriptions>
          </div>
          <template #footer>
            <el-button @click="billDialog = false">关闭</el-button>
            <el-button type="primary" @click="doSettle(billRow)">确认结算</el-button>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Promotion, Aim, Position, Wallet } from '@element-plus/icons-vue'

type Row = { plate: string; park: string; slot: string; type: string;
  time?: string; inTime?: string; outTime?: string; duration?: string;
  amount?: string; voucher?: string; operator?: string; settled?: boolean }

const parkList = ['P01 中央广场','P02 客运枢纽','P03 商业中心','P04 医院','P05 科技园']
const activeTab = ref<'entry' | 'exit'>('entry')
const stats = reactive({ entry: 42, exit: 38 })

const entryForm = reactive({ plate: '京A88888', park: parkList[0], slot: 'A-03-12', type: '小型车', time: '', operator: '001' })
const entryRules: FormRules = {
  plate: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  park:  [{ required: true, message: '请选择停车场', trigger: 'change' }]
}
const entryFormRef = ref<FormInstance>()
const submitting = ref(false)

const makeTime = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const entryRecs = ref<Row[]>([
  { plate: '京A88888', park: 'P01 中央广场', slot: 'A-03-12', type: '小型车', time: makeTime(), operator: '001' },
  { plate: '沪B66666', park: 'P02 客运枢纽', slot: 'B-05-08', type: '中型车', time: '09:12', operator: '003' },
  { plate: '粤C12345', park: 'P03 商业中心', slot: 'C-01-01', type: '新能源', time: '09:24', operator: '001' },
  { plate: '京D99999', park: 'P01 中央广场', slot: 'A-01-05', type: '大型车', time: '09:38', operator: '002' }
])

const exitRecs = ref<Row[]>([
  { plate: '京Z00001', park: 'P01 中央广场', slot: 'A-03-12', type: '小型车', inTime: '07:12', outTime: '10:46', duration: '3h 34m', amount: '14.00', voucher: '会员 -3' },
  { plate: '沪B66666', park: 'P02 客运枢纽', slot: 'B-05-08', type: '中型车', inTime: '08:22', outTime: '10:12', duration: '1h 50m', amount: '9.00', voucher: '-' },
  { plate: '粤C12345', park: 'P03 商业中心', slot: 'C-01-01', type: '新能源', inTime: '09:24', outTime: '11:02', duration: '1h 38m', amount: '4.00', voucher: '充电抵扣' },
  { plate: '津E87654', park: 'P04 医院', slot: 'D-02-22', type: '小型车', inTime: '06:50', outTime: '12:20', duration: '5h 30m', amount: '22.00', voucher: '就诊 -8' }
])

const submitEntry = async () => {
  const ok = await entryFormRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  await new Promise(r => setTimeout(r, 380))
  entryRecs.value.unshift({
    plate: entryForm.plate, park: entryForm.park, slot: entryForm.slot,
    type: entryForm.type, time: makeTime(), operator: entryForm.operator || '—'
  })
  stats.entry += 1
  ElMessage.success('已登记入场')
  submitting.value = false
}
const resetEntry = () => { entryForm.plate = ''; entryForm.slot = ''; entryForm.time = '' }

const exitFilter = ref('')
const filteredExit = computed(() => exitRecs.value.filter(r => !exitFilter.value || r.plate.includes(exitFilter.value)))

const billDialog = ref(false)
const billRow = ref<Row | null>(null)
const showBill = (r: Row) => { billRow.value = r; billDialog.value = true }
const settle = (r: Row) => { billRow.value = r; billDialog.value = true }
const doSettle = (r: Row | null) => {
  if (!r) return
  r.settled = true
  stats.exit += 1
  ElMessage.success(`已结算 ${r.plate} ¥${r.amount}`)
  billDialog.value = false
  exitRecs.value = exitRecs.value.filter(x => x !== r)
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page__card { padding: 20px; }
.page__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 12px 0 20px; flex-wrap: wrap; }
.page__head-sub { font-size: 11px; letter-spacing: 0.2em; color: var(--app-text-4); }
.page__head-main { font-size: 22px; font-weight: 700; color: var(--app-text-1); margin-top: 2px; }
.page__head-right { display: flex; gap: 10px; flex-wrap: wrap; }
.quick-pill { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 999px; background: #fff; border: 1px solid rgba(0,0,0,0.05); font-size: 12px; color: var(--app-text-3); white-space: nowrap; }
.quick-pill b { color: var(--app-text-1); font-size: 13.5px; font-variant-numeric: tabular-nums; margin-left: 4px; }
.quick-pill .accent { color: var(--app-accent); }
.tab-switch { display: inline-flex; gap: 8px; padding: 4px; background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06); border-radius: 999px; margin-bottom: 16px; }
.tab-switch__btn { all: unset; cursor: pointer; height: 38px; padding: 0 20px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--app-text-2); transition: background var(--app-transition), color var(--app-transition), box-shadow var(--app-transition); white-space: nowrap; }
.tab-switch__btn:hover { color: var(--app-text-1); }
.tab-switch__btn.is-active { background: #fff; color: var(--app-accent); box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.05); }
.tab-switch__count { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 6px; border-radius: 999px; font-size: 10.5px; font-weight: 700; background: rgba(0,0,0,0.04); color: var(--app-text-2); }
.tab-switch__btn.is-active .tab-switch__count { background: rgba(47,111,255,0.12); color: var(--app-accent); }
.tab-panel { display: flex; flex-direction: column; gap: 16px; }
.tab-panel__grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; }
@media (max-width: 1180px) { .tab-panel__grid { grid-template-columns: 1fr; } }
.card--lite { padding: 18px; background: #fff; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); }
.card-title { font-size: 15px; font-weight: 600; color: var(--app-text-1); margin-bottom: 14px; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
.muted { color: var(--app-text-3); font-size: 12px; font-weight: 400; }
.money { color: var(--app-accent); font-variant-numeric: tabular-nums; }
.camera { position: relative; height: 180px; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, #0a0f1e 0%, #1b2a52 60%, #0a0f1e 100%); border: 1px solid rgba(255,255,255,0.08); }
.camera__scanner { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #3fe28b, transparent); box-shadow: 0 0 10px #3fe28b; animation: scan 2.4s linear infinite; top: 20%; }
.camera__live { position: absolute; left: 12px; top: 12px; font-size: 11px; color: #e24747; font-weight: 700; letter-spacing: 0.1em; }
.camera__plate { position: absolute; left: 16px; right: 16px; bottom: 14px; background: rgba(0,0,0,0.55); color: #fff; padding: 8px 10px; border-radius: 8px; font-size: 13px; }
@keyframes scan { 0% { top: 18%; } 50% { top: 82%; } 100% { top: 18%; } }
</style>
