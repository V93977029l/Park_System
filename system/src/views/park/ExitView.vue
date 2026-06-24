<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card class="card" shadow="never">
          <el-tabs v-model="tab" class="camera-tabs">
            <el-tab-pane label="摄像头扫车牌" name="rec">
              <template #label><span>📷 摄像头扫车牌</span></template>
            </el-tab-pane>
            <el-tab-pane label="手动输入" name="manual">
              <template #label><span>✍️ 手动输入</span></template>
            </el-tab-pane>
            <el-tab-pane label="无牌车" name="noplate">
              <template #label><span>🅿️ 无牌车</span></template>
            </el-tab-pane>
          </el-tabs>

          <div class="vehicle-camera">
            <div class="scan-line"></div>
            <div class="live">
              <div class="bulb">REC</div>
              <span>LIVE</span>
            </div>
          </div>

          <div class="rec-result">已识别：<b>{{ plate }}</b></div>

          <el-button type="primary" style="width:48%;" @click="lockPlate">🔒 锁定车牌</el-button>
          <el-button style="width:48%; margin-left:4%;" @click="refreshPlate">🔄 手动刷新</el-button>

          <el-alert class="alert-mt"
            :title="lockMsg"
            :type="lockMsg ? 'success' : 'info'"
            :closable="false" />

          <el-card class="sub-card" shadow="never">
            <template #header><span class="card-title">在场车辆（{{ currentList.length }}）</span></template>
            <el-table :data="currentList" stripe size="small" max-height="200" height="200">
              <el-table-column prop="plate" label="车牌" width="110" />
              <el-table-column prop="entry" label="入口" width="70" />
              <el-table-column prop="time" label="入场" width="130" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button size="small" type="primary" link @click="loadBill(row)">加载</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="card bill" shadow="never">
          <div class="bill-head">
            <div class="plate-big">{{ plate }}</div>
            <div class="seat">国贸 P001 · A023</div>
          </div>

          <div class="time-row">
            <div class="time-cell">
              <div class="lbl">入场时间</div>
              <div class="val">{{ bill.entryTime || '--' }}</div>
            </div>
            <div class="arrow">→</div>
            <div class="time-cell right">
              <div class="lbl">出场时间</div>
              <div class="val">{{ bill.exitTime || '--' }}</div>
            </div>
          </div>

          <div class="duration-row">
            <el-icon class="icon"><Clock /></el-icon>
            <span class="txt">停车时长</span>
            <span class="big">{{ bill.h }} 小时 {{ bill.m }} 分</span>
          </div>

          <div class="divider"></div>

          <div class="fee-list">
            <div class="fee-line"><span>首小时</span><span>¥10.00</span></div>
            <div class="fee-line"><span>后续 {{ bill.nextHours }} 小时 × ¥5.00</span><span>¥{{ bill.nextFee.toFixed(2) }}</span></div>
            <div class="fee-line total"><span>合计</span><span>¥{{ bill.total.toFixed(2) }}</span></div>
            <div class="fee-line cap"><span>封顶 ¥80（本次未达封顶）</span></div>
          </div>

          <div class="amount-row">
            <div class="lbl">应付金额</div>
            <div class="amount">¥{{ bill.total.toFixed(2) }}</div>
          </div>

          <div class="pay-row">
            <el-button class="pay-btn primary" type="primary" size="large" @click="doPay('无感支付')">🅰️ 无感支付</el-button>
            <el-button class="pay-btn wechat" size="large" @click="doPay('微信支付')">🟢 微信</el-button>
            <el-button class="pay-btn alipay" size="large" @click="doPay('支付宝')">🔵 支付宝</el-button>
            <el-button class="pay-btn cash" size="large" @click="doPay('现金')">💰 现金</el-button>
            <el-button class="pay-btn vip" size="large" @click="doPay('月卡抵扣')">💳 月卡</el-button>
          </div>

          <el-dialog v-model="showReceipt" title="小票 · 出场确认" width="420" :close-on-click-modal="false">
            <div class="receipt">
              <div class="r-title">🎫 出场凭证</div>
              <div class="r-row"><span>车牌</span><span>{{ plate }}</span></div>
              <div class="r-row"><span>停车场</span><span>国贸中心</span></div>
              <div class="r-row"><span>入场</span><span>{{ bill.entryTime }}</span></div>
              <div class="r-row"><span>出场</span><span>{{ bill.exitTime }}</span></div>
              <div class="r-row"><span>时长</span><span>{{ bill.h }}小时{{ bill.m }}分</span></div>
              <div class="r-row"><span>金额</span><b class="r-b">¥{{ bill.total.toFixed(2) }}</b></div>
              <div class="r-row"><span>支付</span><span>{{ lastPayType }}</span></div>
              <div class="r-tip">祝您一路顺风 🚗💨</div>
            </div>
            <template #footer>
              <el-button type="primary" @click="confirmExit">确认出场</el-button>
              <el-button @click="showReceipt = false">关闭</el-button>
            </template>
          </el-dialog>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="card" shadow="never">
          <template #header><span class="card-title">今日出场实时列表</span></template>

          <el-table :data="filteredList" stripe size="default" max-height="420">
            <el-table-column prop="plate" label="车牌" width="110" />
            <el-table-column prop="pay" label="支付方式" width="90" />
            <el-table-column prop="amount" label="金额" width="90">
              <template #default="{ row }">¥{{ row.amount.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="time" label="时间" width="120" />
            <el-table-column prop="operator" label="操作员" width="80" />
          </el-table>

          <div class="stat-row">
            <div class="stat-cell"><div class="num">{{ exitTotal }}</div><div class="lbl">今日出场</div></div>
            <div class="stat-cell"><div class="num blue">¥{{ incomeTotal.toLocaleString() }}</div><div class="lbl">今日营收</div></div>
            <div class="stat-cell"><div class="num warn">¥{{ avgPrice.toFixed(1) }}</div><div class="lbl">平均客单价</div></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Clock } from '@element-plus/icons-vue'

const prefix = ['京A', '京B', '京C']
const tail = ['12345', '67890', '88888', 'A8888', '10000']
const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
const plateSeed = (i: number) => prefix[i % 3] + tail[i % 5]

const makeTime = (offsetMin: number) => {
  const d = new Date(Date.now() - offsetMin * 60000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const makeBill = (entryOffsetMin: number) => {
  const entry = new Date(Date.now() - entryOffsetMin * 60000)
  const exit = new Date()
  const mins = Math.max(1, Math.round((exit.getTime() - entry.getTime()) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const nextHours = Math.max(0, h - 1) + (m > 0 ? 1 : 0)
  const nextFee = Math.round(nextHours * 5 * 100) / 100
  let total = 10 + nextFee
  if (total > 80) total = 80
  total = Math.round(total * 100) / 100
  const p = (x: Date) => String(x).slice(11, 19)
  return {
    entryTime: p(entry), exitTime: p(exit), h, m,
    nextHours, nextFee, total
  }
}

const mockOut = (count: number) => Array.from({ length: count }).map((_, i) => ({
  plate: plateSeed(i),
  pay: rand(['无感支付', '微信支付', '支付宝', '现金', '月卡抵扣']),
  amount: Math.round((Math.random() * 80 + 2) * 100) / 100,
  time: makeTime(i * 9 + 3),
  operator: rand(['自动', '王静', '刘强', '系统'])
}))

const mockCurrent = (count: number) => Array.from({ length: count }).map((_, i) => ({
  plate: plateSeed(i + 7),
  entry: rand(['A01', 'A02', 'B01', 'B02']),
  time: makeTime(i * 5 + 12)
}))

const tab = ref('rec')
const plate = ref('京A·88888')
const lockMsg = ref('')
const showReceipt = ref(false)
const lastPayType = ref('无感支付')

const bill = reactive({ entryTime: '14:21:33', exitTime: '16:47:12', h: 2, m: 26, nextHours: 1, nextFee: 8, total: 18 })
const currentList = ref<any[]>([])
const allList = ref<any[]>([])
const filteredList = computed(() => allList.value)

const exitTotal = computed(() => allList.value.length)
const incomeTotal = computed(() => Math.round(allList.value.reduce((s, x) => s + Number(x.amount || 0), 0)))
const avgPrice = computed(() => exitTotal.value ? Math.round(incomeTotal.value / exitTotal.value * 10) / 10 : 0)

const refreshPlate = () => {
  plate.value = rand(prefix) + '·' + rand(tail)
  lockMsg.value = ''
  ElMessage.info(`刷新识别：${plate.value}`)
}

const lockPlate = () => {
  lockMsg.value = `已锁定 ${plate.value}`
  loadBill({ plate: plate.value, entry: 'A01', time: makeTime(146) })
  ElMessage.success(`锁定成功，正在计算账单`)
}

const loadBill = (row: any) => {
  plate.value = row.plate
  const b = makeBill(146)
  Object.assign(bill, b)
  lockMsg.value = ''
}

const doPay = (payType: string) => {
  if (!bill.total) { ElMessage.warning('请先加载结算单'); return }
  lastPayType.value = payType
  if (payType === '无感支付') {
    ElMessage.success(`无感支付成功！已扣款 ¥${bill.total.toFixed(2)}，车牌 ${plate.value}`)
    showReceipt.value = true
  } else {
    ElMessage.info(`已发起 ${payType}，金额 ¥${bill.total.toFixed(2)}，请完成支付`)
  }
}

const confirmExit = () => {
  allList.value.unshift({
    plate: plate.value,
    pay: lastPayType.value,
    amount: bill.total,
    time: makeTime(0),
    operator: '自动'
  })
  currentList.value = currentList.value.filter(x => x.plate !== plate.value)
  showReceipt.value = false
  ElMessage.success(`车牌 ${plate.value} 已出场`)
}

let timer: number
onMounted(() => {
  allList.value = mockOut(30)
  currentList.value = mockCurrent(12)
  timer = window.setInterval(() => {
    if (tab.value === 'rec' && !lockMsg.value) {
      plate.value = rand(prefix) + '·' + rand(tail)
    }
  }, 3800)
})

onUnmounted(() => window.clearInterval(timer))
</script>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; gap: 12px; padding: 12px 0; }
.card { border-radius: 10px; }
.sub-card { margin-top: 12px; }
.card-title { font-weight: 600; color: #303133; font-size: 15px; }

.camera-tabs { margin-bottom: 4px; }

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

.rec-result {
  text-align: center; padding: 10px; margin: 8px 0 10px;
  background: #f0f9ff; border-radius: 8px;
  b { color: #409eff; font-size: 18px; letter-spacing: 2px; }
}
.alert-mt { margin-top: 10px; }

.bill { font-family: 'Courier New', monospace; }
.bill-head {
  background: linear-gradient(90deg,#409eff,#66b1ff); color: #fff;
  padding: 18px 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 14px;
  .plate-big { font-size: 26px; font-weight: 700; letter-spacing: 3px; }
  .seat { opacity: .9; margin-top: 4px; }
}

.time-row {
  display: flex; justify-content: space-between; align-items: center;
  background: #fafbfc; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;
  .time-cell { .lbl { color: #909399; font-size: 12px; } .val { font-size: 18px; font-weight: 700; } }
  .arrow { color: #c0c4cc; font-size: 22px; }
  .time-cell.right .val { color: #f56c6c; }
}

.duration-row {
  display: flex; align-items: center; gap: 10px; padding: 10px 0 4px;
  .icon { font-size: 22px; color: #67c23a; }
  .txt { color: #606266; font-size: 13px; }
  .big { font-size: 22px; font-weight: 700; color: #303133; letter-spacing: 2px; margin-left: auto; }
}

.divider { border-top: 1px dashed #dcdfe6; margin: 8px 0 12px; }

.fee-list {
  padding: 6px 2px;
  .fee-line {
    display: flex; justify-content: space-between; padding: 4px 0; color: #606266;
  }
  .fee-line.total { font-weight: 700; color: #303133; border-top: 1px solid #ebeef5; padding-top: 10px; margin-top: 6px; }
  .fee-line.cap { color: #909399; font-size: 12px; }
}

.amount-row {
  display: flex; justify-content: space-between; align-items: baseline;
  margin: 14px 0 14px; padding: 14px 16px;
  background: linear-gradient(90deg,#fff1f0,#fff); border-radius: 10px;
  .lbl { color: #909399; font-size: 14px; }
  .amount { font-size: 36px; font-weight: 800; color: #f56c6c; letter-spacing: 1px; }
}

.pay-row { display: flex; gap: 8px; flex-wrap: wrap; }
.pay-btn {
  flex: 1 1 30%; min-width: 96px; font-weight: 600;
}
.pay-btn.primary { }
.pay-btn.wechat { background:#07c160; border-color:#07c160; color:#fff; }
.pay-btn.alipay { background:#1677ff; border-color:#1677ff; color:#fff; }
.pay-btn.cash { background:#909399; border-color:#909399; color:#fff; }
.pay-btn.vip { background:#e6a23c; border-color:#e6a23c; color:#fff; }

.receipt { text-align: center; padding: 10px 18px;
  .r-title { font-size: 18px; font-weight: 700; margin-bottom: 14px; color: #409eff; }
  .r-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ebeef5; color: #606266; }
  .r-row:last-of-type { border-bottom: 0; }
  .r-b { color:#f56c6c; font-size:20px; }
  .r-tip { margin-top: 14px; color: #909399; }
}

.stat-row {
  display: flex; justify-content: space-between; margin-top: 14px; padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  .stat-cell { text-align: center; flex: 1; }
  .num { font-size: 28px; font-weight: 700; color: #409eff; }
  .num.blue { color: #1677ff; }
  .num.warn { color: #e6a23c; }
  .lbl { color: #909399; font-size: 12px; margin-top: 2px; }
}
</style>
