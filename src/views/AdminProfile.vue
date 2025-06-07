<template>
  <div class="admin-profile">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
          <el-button type="primary" @click="handleEdit" v-if="!isEditing">编辑</el-button>
          <div v-else>
            <el-button type="success" @click="handleSave">保存</el-button>
            <el-button @click="handleCancel">取消</el-button>
          </div>
        </div>
      </template>
      
      <el-form :model="adminForm" label-width="120px" :disabled="!isEditing">
        <el-form-item label="用户名">
          <el-input v-model="adminForm.username" />
        </el-form-item>
        
        <el-form-item label="密码">
          <el-input v-model="adminForm.password" type="password" />
        </el-form-item>
        
        <el-form-item label="创建时间">
          <el-input v-model="formattedCreatedTime" disabled />
        </el-form-item>
        
        <el-form-item label="身份">
          <el-input v-model="adminForm.identity" disabled />
        </el-form-item>
        
        <el-form-item label="权限套餐">
          <el-input v-model="permissionName" disabled />
        </el-form-item>

        <el-form-item label="权限列表">
          <div class="permissions-list">
            <el-tag v-for="(permission, index) in permissionList" 
                    :key="index" 
                    class="permission-tag"
                    type="success">
              {{ permission }}
            </el-tag>
          </div>
        </el-form-item>
        
        <el-form-item label="真实姓名">
          <el-input v-model="adminForm.name" />
        </el-form-item>
        
        <el-form-item label="电子邮件">
          <el-input v-model="adminForm.email" />
        </el-form-item>
        
        <el-form-item label="手机号">
          <el-input v-model="adminForm.phone" />
        </el-form-item>
        
        <el-form-item label="最后登录时间">
          <el-input v-model="formattedLastLoginTime" disabled />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'AdminProfile',
  setup() {
    const adminForm = ref({
      id: null,
      username: '',
      password: '',
      createdTime: '',
      identity: '',
      permissionId: '',
      name: '',
      email: '',
      phone: '',
      lastLoginTime: ''
    })
    
    const isEditing = ref(false)
    const originalForm = ref(null)
    const permissionName = ref('')
    const permissionList = ref([])
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    // 计算属性：格式化后的创建时间
    const formattedCreatedTime = computed(() => formatDate(adminForm.value.createdTime))
    
    // 计算属性：格式化后的最后登录时间
    const formattedLastLoginTime = computed(() => formatDate(adminForm.value.lastLoginTime))
    
    // 获取权限套餐信息
    const fetchPermissionPackage = async (permissionId) => {
      try {
        console.log('Fetching permission package for ID:', permissionId)
        const baseUrl = 'http://localhost:8086'
        const response = await axios.get(`${baseUrl}/iot/prices/${permissionId}`)
        console.log('Permission package response:', response.data)
        if (response.data.code === 0) {
          const permissionData = response.data.data
          permissionName.value = permissionData.permissionName
          // 解析权限卡片字符串
          const cardStr = permissionData.card
          console.log('Permission card string:', cardStr)
          const permissionIds = cardStr.replace(/[{}]/g, '').split(',').map(Number)
          console.log('Parsed permission IDs:', permissionIds)
          // 获取每个权限的详细信息
          await fetchPermissionDetails(permissionIds)
        }
      } catch (error) {
        console.error('Error fetching permission package:', error)
        ElMessage.error('获取权限套餐信息失败')
      }
    }

    // 获取权限详细信息
    const fetchPermissionDetails = async (permissionIds) => {
      try {
        const permissions = []
        const baseUrl = 'http://localhost:8086'
        for (const id of permissionIds) {
          console.log('Fetching permission details for ID:', id)
          const response = await axios.get(`${baseUrl}/iot/permission/${id}`)
          console.log('Permission details response:', response.data)
          if (response.data.code === 0) {
            permissions.push(response.data.data.name)
          }
        }
        console.log('All permissions:', permissions)
        permissionList.value = permissions
      } catch (error) {
        console.error('Error fetching permission details:', error)
        ElMessage.error('获取权限详细信息失败')
      }
    }
    
    const fetchAdminProfile = async () => {
      try {
        const adminId = localStorage.getItem('adminId')
        console.log('Fetching profile for adminId:', adminId)
        const response = await axios.get(`/api/amin/profile/${adminId}`)
        console.log('Profile response:', response.data)
        if (response.data.code === 0) {
          adminForm.value = response.data.data
          originalForm.value = JSON.parse(JSON.stringify(response.data.data))
          // 获取权限套餐信息
          if (adminForm.value.permissionId) {
            console.log('Found permissionId:', adminForm.value.permissionId)
            await fetchPermissionPackage(adminForm.value.permissionId)
          } else {
            console.log('No permissionId found in profile data')
          }
        } else {
          ElMessage.error(response.data.msg || '获取个人信息失败')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        ElMessage.error('获取个人信息失败')
      }
    }
    
    const handleEdit = () => {
      isEditing.value = true
    }
    
    const handleSave = async () => {
      try {
        const response = await axios.put('/api/amin/profile', adminForm.value)
        if (response.data.code === 0) {
          ElMessage.success('保存成功')
          isEditing.value = false
          await fetchAdminProfile()
        } else {
          ElMessage.error(response.data.msg || '保存失败')
        }
      } catch (error) {
        console.error('Error saving profile:', error)
        ElMessage.error('保存失败')
      }
    }
    
    const handleCancel = () => {
      adminForm.value = JSON.parse(JSON.stringify(originalForm.value))
      isEditing.value = false
    }
    
    onMounted(() => {
      fetchAdminProfile()
    })
    
    return {
      adminForm,
      isEditing,
      formattedCreatedTime,
      formattedLastLoginTime,
      permissionName,
      permissionList,
      handleEdit,
      handleSave,
      handleCancel
    }
  }
}
</script>

<style scoped>
.admin-profile {
  padding: 20px;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-form {
  margin-top: 20px;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.permission-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  padding: 4px 8px;
  font-size: 14px;
}
</style> 