<template>
  <div class="device-message-container">
    <div class="content-wrapper">
      <div class="search-container">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="设备ID">
            <el-input v-model="searchForm.deviceId" placeholder="请输入设备ID" clearable />
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="searchForm.timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
            <el-button type="success" :loading="loading" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="tableData"
          border
          style="width: 100%"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: 'bold'
          }"
        >
          <el-table-column prop="statusId" label="状态ID" min-width="120" show-overflow-tooltip />
          <el-table-column prop="deviceId" label="设备ID" min-width="120" show-overflow-tooltip />
          <el-table-column label="温度" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="danger" effect="plain">
                {{ getTemperature(row.statusData) }}°C
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="湿度" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="primary" effect="plain">
                {{ getHumidity(row.statusData) }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tag size="small" effect="plain">
                {{ formatDateTime(row.createdAt) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref([])
const allData = ref([]) // 存储所有数据
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = ref({
  deviceId: '',
  timeRange: []
})

const router = useRouter()

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const response = await axios.get('/admin/api/device-stats', {
      params: {
        deviceId: searchForm.value.deviceId,
        startTime: searchForm.value.timeRange[0],
        endTime: searchForm.value.timeRange[1]
      }
    })
    console.log('后端返回的数据:', response.data)
    
    if (response.data && Array.isArray(response.data)) {
      // 存储所有数据
      allData.value = response.data.map(item => ({
        ...item,
        statusData: item.statusData || '{}'  // 确保 statusData 字段存在
      }))
      total.value = allData.value.length
      // 根据当前页码和每页大小计算要显示的数据
      updateTableData()
    } else {
      console.error('数据格式不正确:', response.data)
      ElMessage.error('数据格式不正确')
    }
  } catch (error) {
    console.error('获取设备状态列表失败:', error)
    if (error.response?.status === 401) {
      ElMessage.error('请先登录')
      router.push('/login')
    } else {
      ElMessage.error(error.response?.data?.message || '获取设备状态列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 更新表格数据（前端分页）
const updateTableData = () => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  tableData.value = allData.value.slice(start, end)
}

// 解析温度数据
const getTemperature = (statusData) => {
  if (!statusData) {
    return '-'
  }
  try {
    const data = JSON.parse(statusData)
    return data.temperature || '-'
  } catch (e) {
    console.error('解析温度数据失败:', e, '原始数据:', statusData)
    return '-'
  }
}

// 解析湿度数据
const getHumidity = (statusData) => {
  if (!statusData) {
    return '-'
  }
  try {
    const data = JSON.parse(statusData)
    return data.humidity || '-'
  } catch (e) {
    console.error('解析湿度数据失败:', e, '原始数据:', statusData)
    return '-'
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    deviceId: '',
    timeRange: []
  }
  currentPage.value = 1
  fetchData()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  updateTableData()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  updateTableData()
}

// 刷新数据
const handleRefresh = () => {
  fetchData()
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.device-message-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.search-container {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.table-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-button .el-icon) {
  margin-right: 4px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  font-weight: bold;
}

:deep(.el-tag) {
  border-radius: 4px;
}

:deep(.el-table .cell) {
  white-space: nowrap;
}
</style> 