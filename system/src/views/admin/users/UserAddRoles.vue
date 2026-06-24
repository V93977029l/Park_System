<template>
  <el-row justify="center" style="margin-top: 50px">
    <el-transfer v-model="value" :data="data" />
  </el-row>
  <el-row justify="center" style="margin-top: 50px">
    <el-button type="primary" @click="handleSave">保存</el-button>
  </el-row>
</template>
<script setup>
import { users } from '../../../http'
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

const value = ref([])

const data = reactive([])
var id = ''
onMounted(() => {
  const route = useRoute() //获取上一个页面的值 推送叫router  接收叫route
  id = route.query.id
  queryRolesByUsersId(id)
})
const handleSave = async () => {
  var arr = value.value.toString()
  var result = users.addUsersRole(id, arr)
  if (result.code == 0) {
    queryRolesByUsersId(id)
  }
}
const queryRolesByUsersId = async (id) => {
  var result = await users.queryRolesByUsersId(id)
  if (result.code == 0) {
    var all = result.data.all
    var has = result.data.has
    //对all这个数组 进行循环 element为其中的对象
    all.forEach((element) => {
      data.push({ key: element.roleId, label: element.roleName })
    })
    has.forEach((element) => {
      value.value.push(element.roleId)
    })
  }
}
</script>
