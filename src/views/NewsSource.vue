<template>
  <div class="news-source-container">
    <div class="header">
      <h2>新闻来源管理</h2>
      <el-button type="primary" @click="handleAdd">添加来源</el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="来源名称">
          <el-input v-model="queryParams.name" placeholder="请输入来源名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      v-loading="loading"
      :data="sourceList"
      border
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column prop="name" label="来源名称" />
      <el-table-column prop="url" label="来源URL" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="newsCount" label="新闻数量" width="100" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="来源名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入来源名称" />
        </el-form-item>
        <el-form-item label="来源URL" prop="url">
          <el-input v-model="form.url" placeholder="请输入来源URL" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getNewsSourceList,
  createNewsSource,
  updateNewsSource,
  deleteNewsSource
} from '@/api/news'
import { useUserStore } from '@/stores/user'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const total = ref(0)
const formLoading = ref(false)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: ''
})

const form = reactive({
  id: null,
  name: '',
  url: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入来源名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入来源URL', trigger: 'blur' }],
  description: [{ required: true, message: '请输入来源描述', trigger: 'blur' }]
}

const sourceList = ref([])
const userStore = useUserStore()

// 获取列表数据
const getList = async () => {
  loading.value = true
  try {
    const res = await getNewsSourceList(queryParams)
    // 检查是否是401错误
    if (res.code === 401) {
      ElMessage.error(res.msg || '未授权，请先登录')
      sourceList.value = []
      total.value = 0
      return
    }
    
    // 处理正常数据
    if (Array.isArray(res)) {
      sourceList.value = res.map(item => ({
        id: item.id,
        name: item.sourceName,
        url: item.sourceUrl,
        description: item.sourceDescription,
        newsCount: item.newsCount
      }))
      total.value = res.length
    } else {
      sourceList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取新闻来源列表失败:', error)
    ElMessage.error('获取新闻来源列表失败')
    sourceList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 查询
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置查询
const resetQuery = () => {
  queryParams.name = ''
  handleQuery()
}

// 添加来源
const handleAdd = () => {
  dialogTitle.value = '添加新闻来源'
  form.id = null
  form.name = ''
  form.url = ''
  form.description = ''
  dialogVisible.value = true
}

// 处理编辑新闻来源
const handleEdit = async (row) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8087'
    // 先获取详情
    const response = await fetch(`${baseUrl}/api/news-sources/${row.id}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('获取新闻来源详情失败')
    }
    
    const data = await response.json()
    dialogTitle.value = '编辑新闻来源'
    form.id = data.id
    form.name = data.sourceName
    form.url = data.sourceUrl
    form.description = data.sourceDescription
    dialogVisible.value = true
  } catch (error) {
    console.error('获取新闻来源详情失败:', error)
    ElMessage.error(error.message)
  }
}

// 删除新闻来源
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该新闻来源吗？', '提示', {
      type: 'warning'
    })
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8087'
    const response = await fetch(`${baseUrl}/api/news-sources/${row.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    })
    if (!response.ok) throw new Error('删除失败')
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除新闻来源失败:', error)
      ElMessage.error(error.message)
    }
  }
}

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      formLoading.value = true
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8087'
        const url = form.id
          ? `${baseUrl}/api/news-sources/${form.id}`
          : `${baseUrl}/api/news-sources`
        const method = form.id ? 'PUT' : 'POST'

        // 构造请求数据
        const requestData = {
          id: form.id ? Number(form.id) : 0,
          sourceName: form.name,
          sourceUrl: form.url,
          sourceDescription: form.description
        }

        console.log('Request URL:', url)
        console.log('Request Data:', JSON.stringify(requestData, null, 2))

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userStore.token}`
          },
          body: JSON.stringify(requestData)
        })
        
        if (!response.ok) {
          let errorMessage = '保存失败'
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } catch (e) {
            console.error('解析错误响应失败:', e)
          }
          throw new Error(errorMessage)
        }
        
        ElMessage.success(form.id ? '更新成功' : '添加成功')
        dialogVisible.value = false
        getList()
      } catch (error) {
        console.error('保存新闻来源失败:', error)
        ElMessage.error(error.message)
      } finally {
        formLoading.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: null,
    name: '',
    url: '',
    description: ''
  })
}

// 分页大小改变
const handleSizeChange = (val) => {
  queryParams.pageSize = val
  getList()
}

// 页码改变
const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  getList()
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.news-source-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 