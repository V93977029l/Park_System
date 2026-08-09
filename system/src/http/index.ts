import http from './request'
//工程的上传文件地址
export const uploadContext = 'http://localhost:7777/upload/upload'

//导出的对象 可以在Vue中 通过import 进行调用
//users表示所有的关于用户的请求 都定义在这个对象中 调用时可以通过users.进行调用
export const users = {
  queryUserList(pageNo: string, pageSize: string, mobile: string) {
    return http.get(
      '/user/queryUserList?pageNo=' + pageNo + '&pageSize=' + pageSize + '&mobile=' + mobile
    )
  },
  deleteUser(id: String) {
    return http.delete('/user/deleteUser/' + id)
  },
  addUser(account: string, password: string, mail: string, mobile: string) {
    return http.post('/user/addUser', null, {
      params: { account: account, password: password, mail: mail, mobile: mobile }
    })
  },
  queryUserById(id: String) {
    return http.get('/user/queryById?id=' + id)
  },
  updateUser(param: string) {
    return http.put('/user/updateUser', param)
  },
  queryRolesByUsersId(id: string) {
    return http.get('/user/queryRolesByUsersId?usersId=' + id)
  },
  addUsersRole(usersId: string, roles: string) {
    return http.post('/user/addUsersRole', null, {
      params: { usersId: usersId, roles: roles }
    })
  }
}
export const roles = {
  queryList(pageNo: string | number, pageSize: string | number, roleName: string) {
    return http.get(
      '/role/queryList?pageNo=' + pageNo + '&pageSize=' + pageSize + '&roleName=' + roleName
    )
  },
  update(param: any) {
    return http.put('/role/edit', param)
  },
  add(param: any) {
    return http.post('/role/add', param)
  },
  queryById(id: string | number) {
    return http.get('/role/queryById?id=' + id)
  },
  deleteUser(id: string | number) {
    return http.delete('/role/deleteById?id=' + id)
  }
}
