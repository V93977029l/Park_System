<template>
  <div class="login">
    <div class="login-card">
      <div class="login-title">
        <el-icon :size="32" color="#409EFF"><HomeFilled /></el-icon>
        <span>智慧停车场管理系统</span>
      </div>
      <el-form
        ref="loginFormRef"
        :model="form"
        :rules="loginRules"
        label-width="0"
        size="large"
        @keyup.enter="handlerLogin"
      >
        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="btn-block"
            :loading="loginLoading"
            @click="handlerLogin"
          >登录</el-button>
        </el-form-item>
        <el-form-item>
          <el-button
            size="large"
            class="btn-block"
            plain
            @click="dialogFormVisible = true"
          >注册账号</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>

  <el-dialog
    v-model="dialogFormVisible"
    title="注册账号"
    width="420"
    :close-on-click-modal="false"
  >
    <el-form
      ref="registerFormRef"
      :model="register"
      :rules="registerRules"
      label-width="90px"
      label-position="right"
    >
      <el-form-item label="用户名" prop="name">
        <el-input v-model="register.name" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="register.mobile" placeholder="请输入手机号" maxlength="11" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="register.password" type="password" show-password placeholder="请输入密码" />
      </el-form-item>
      <el-form-item label="身份类型" prop="identity">
        <el-select v-model="register.identity" placeholder="请选择您的身份" style="width: 100%">
          <el-option label="超级管理员" value="admin" />
          <el-option label="停车场运营" value="manager" />
          <el-option label="收费员" value="staff" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogFormVisible = false">取消</el-button>
      <el-button type="primary" :loading="registerLoading" @click="handleRegister">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const loginLoading = ref(false)
const registerLoading = ref(false)
const dialogFormVisible = ref(false)

const form = reactive({
  name: '',
  password: ''
})

const loginRules: FormRules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ]
}

const register = reactive({
  name: '',
  mobile: '',
  password: '',
  identity: ''
})

const registerRules: FormRules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  identity: [{ required: true, message: '请选择身份类型', trigger: 'change' }]
}

const handlerLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loginLoading.value = true
    try {
      ElMessage.success(`欢迎回来，${form.name}`)
      sessionStorage.setItem('username', form.name)
      router.push('/main/index')
    } finally {
      loginLoading.value = false
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    registerLoading.value = true
    try {
      ElMessage.success('注册成功，请前往登录')
      dialogFormVisible.value = false
      registerFormRef.value?.resetFields()
    } finally {
      registerLoading.value = false
    }
  })
}
</script>

<style lang="scss">
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>

<style scoped lang="scss">
.login {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background: url('../assets/login-bg.jpg') center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e6f0fa;
}

.login-card {
  width: 380px;
  padding: 40px 50px 30px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(6px);
}

.login-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 30px;
}

.btn-block {
  width: 100%;
}
</style>
