//对网络请求axios进行封装
import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  baseURL: 'http://localhost:7777', // 基础URL
  timeout: 10000 // 请求超时时间
  // 其他配置...
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 可以在这里添加例如token等请求头
    // config.headers['Authorization'] = 'Bearer yourToken';
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    //响应成功
    if (response.status == 200) {
      const data = response.data //获取到服务器的响应数据
      console.log(data)
      if (data.code == 0) {
        return data
      } else {
        //ELMessage 提示data.msg
        ElMessage.error(data.msg)
        return data
      }
    } else {
      //ELMessage 提示网络错误
      ElMessage.error(response.statusText)
    }
  },
  (error) => {
    // 对响应错误做点什么
    ElMessage.error(error)
    return Promise.reject(error)
  }
)

export default http
