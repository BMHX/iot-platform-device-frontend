<template>
  <div class="news-container">
    <div class="news-header">
      <h2>新闻管理</h2>
      <el-button type="primary" @click="handleAdd">添加新闻</el-button>
        </div>

    <div class="search-bar">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="标题">
          <el-input v-model="queryParams.title" placeholder="请输入新闻标题" clearable />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="queryParams.sourceId" placeholder="请选择新闻来源" clearable>
            <el-option
              v-for="item in sourceOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
        </div>

    <el-table
      v-loading="loading"
      :data="newsList"
      border
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column prop="title" label="标题" show-overflow-tooltip />
      <el-table-column label="封面图" width="120">
        <template #default="{ row }">
          <el-image
            v-if="row.coverImageUrl"
            :src="row.coverImageUrl"
            :preview-src-list="[row.coverImageUrl]"
            fit="cover"
            style="width: 80px; height: 60px"
        >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div v-else class="image-error">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="sourceName" label="来源" width="120" />
      <el-table-column prop="updateTime" label="发布日期">
        <template #default="scope">
          {{ formatDateTime(scope.row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="viewCount" label="浏览量" width="100">
        <template #default="{ row }">
          <el-tag size="small" type="info">
            <el-icon><View /></el-icon>
            {{ row.viewCount || 0 }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.content || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'">
            {{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="50%"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="来源" prop="sourceId">
          <el-select v-model="form.sourceId" placeholder="请选择新闻来源">
            <el-option
              v-for="source in sourceOptions"
              :key="source.id"
              :label="source.name"
              :value="source.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图" prop="coverImage">
          <div class="cover-container">
            <el-upload
              class="cover-uploader"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleCoverSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeCoverUpload"
            >
              <img v-if="form.coverImage" :src="form.coverImage" class="cover-image" />
              <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="cover-input">
              <el-input
                v-model="form.coverImage"
                placeholder="或直接输入图片URL"
                clearable
              >
                <template #append>
                  <el-button @click="validateImageUrl">验证</el-button>
                </template>
              </el-input>
              <div class="cover-tip">建议尺寸：800x400像素，支持jpg、png格式</div>
      </div>
          </div>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入新闻内容"
          />
        </el-form-item>
        <el-form-item label="发布日期" prop="publishDate">
          <el-date-picker
            v-model="form.publishDate"
            type="datetime"
            placeholder="选择发布日期"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="DRAFT">草稿</el-radio>
            <el-radio label="PUBLISHED">发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="formLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getNewsList,
  createNews,
  updateNews,
  deleteNews,
  getNewsSourceList
} from '@/api/news'
import { View, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const formLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const total = ref(0)
const sourceOptions = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const queryParams = reactive({
  title: '',
  sourceId: undefined
})

const form = ref({
  id: null,
  title: '',
  content: '',
  sourceId: '',
  coverImage: '',
  publishDate: '',
  status: 'DRAFT'
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  sourceId: [{ required: true, message: '请选择来源', trigger: 'change' }],
  publishDate: [{ required: true, message: '请选择发布日期', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const newsList = ref([])

// 获取新闻来源列表
const getSourceOptions = async () => {
  try {
    const res = await getNewsSourceList({ pageSize: 100 })
    if (Array.isArray(res)) {
      sourceOptions.value = res.map(item => ({
        id: item.id,
        name: item.sourceName
      }))
    } else {
      sourceOptions.value = []
    }
  } catch (error) {
    console.error('获取新闻来源列表失败:', error)
    ElMessage.error('获取新闻来源列表失败')
    sourceOptions.value = []
  }
}

// 获取新闻列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getNewsList(queryParams)
    if (res && res.content) {
      newsList.value = res.content.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        updateTime: item.updateTime,
        viewCount: item.viewCount,
        coverImageUrl: item.coverImageUrl,
        sourceId: item.sourceId,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl
      }))
      total.value = res.totalElements || 0
      } else {
      newsList.value = []
      total.value = 0
      }
  } catch (error) {
    console.error('获取新闻列表失败:', error)
    ElMessage.error('获取新闻列表失败')
    newsList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 查询
const handleQuery = () => {
  currentPage.value = 1
  getList()
}

// 重置查询
const resetQuery = () => {
  queryParams.title = ''
  queryParams.sourceId = undefined
  handleQuery()
}

// 添加新闻
const handleAdd = () => {
  dialogTitle.value = '添加新闻'
  form.value = {
    id: null,
    title: '',
    content: '',
    sourceId: '',
    coverImage: '',
    publishDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
    status: 'DRAFT'
  }
  dialogVisible.value = true
}

// 编辑新闻
const handleEdit = (row) => {
  dialogTitle.value = '编辑新闻'
  form.value = {
    id: row.id,
    title: row.title,
    content: row.content,
    sourceId: row.sourceId,
    coverImage: row.coverImageUrl || '',
    publishDate: row.updateTime,
    status: row.status
  }
  dialogVisible.value = true
}

// 删除新闻
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确认要删除该新闻吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteNews(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      console.error('删除新闻失败:', error)
      ElMessage.error('删除新闻失败')
    }
  })
}

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      formLoading.value = true
      try {
        const url = form.value.id
          ? `${import.meta.env.VITE_API_BASE_URL}/admin/api/news/${form.value.id}`
          : `${import.meta.env.VITE_API_BASE_URL}/admin/api/news`
        const method = form.value.id ? 'PUT' : 'POST'
        
        // 获取选中的新闻来源
        const selectedSource = sourceOptions.value.find(s => s.id === Number(form.value.sourceId))
        if (!selectedSource) {
          ElMessage.error('请选择有效的新闻来源')
          return
        }

        // 构造请求数据，确保格式与后端测试接口一致
        const requestData = {
          id: form.value.id ? Number(form.value.id) : 0,
          title: form.value.title,
          content: form.value.content,
          updateTime: form.value.publishDate,
          viewCount: 0,
          coverImageUrl: form.value.coverImage || '',
          sourceId: Number(form.value.sourceId),
          sourceName: selectedSource.name
        }

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
          const errorData = await response.json()
          throw new Error(errorData.message || (form.value.id ? '更新新闻失败' : '添加新闻失败'))
        }
        
        ElMessage.success(form.value.id ? '更新成功' : '添加成功')
        dialogVisible.value = false
        getList()
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error(error.message)
      } finally {
        formLoading.value = false
      }
    }
  })
}

// 上传相关配置
const uploadUrl = `${import.meta.env.VITE_API_BASE_URL}/admin/api/news/upload`

const uploadHeaders = {
  Authorization: `Bearer ${userStore.token}`
}

// 处理封面图上传成功
const handleCoverSuccess = (response) => {
  if (response.code === 200) {
    form.value.coverImage = response.data
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传前检查
const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！')
    return false
  }
  return true
}

// 处理上传错误
const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败，请重试')
}

// 验证图片URL
const validateImageUrl = () => {
  if (!form.value.coverImage) {
    ElMessage.warning('请输入图片URL')
    return
  }
  
  // 创建一个图片对象来验证URL是否有效
  const img = new Image()
  img.onload = () => {
    ElMessage.success('图片URL有效')
  }
  img.onerror = () => {
    ElMessage.error('图片URL无效或无法访问')
    form.value.coverImage = ''
  }
  img.src = form.value.coverImage
}

// 日期格式化函数
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-'
  const date = new Date(dateTimeStr)
  if (isNaN(date.getTime())) return '-'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

onMounted(() => {
  getSourceOptions()
  getList()
})
</script>

<style scoped>
.news-container {
  padding: 20px;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.image-error {
  width: 80px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

.cover-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.cover-input {
  flex: 1;
  min-width: 300px;
}

.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 300px;
  height: 150px;
}

.cover-uploader:hover {
  border-color: #409EFF;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 300px;
  height: 150px;
  line-height: 150px;
  text-align: center;
}

.cover-image {
  width: 300px;
  height: 150px;
  object-fit: cover;
}

.cover-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>

