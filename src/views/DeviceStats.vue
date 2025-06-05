<template>
  <div class="device-stats-container">
    <div class="header">
      <h2>设备消息管理</h2>
      <div class="actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="设备ID">
          <el-input v-model="filterForm.deviceId" placeholder="请输入设备ID" clearable />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      :data="filteredData"
      style="width: 100%"
      v-loading="loading"
      border
    >
      <el-table-column prop="statusId" label="状态ID" width="100" />
      <el-table-column prop="deviceId" label="设备ID" width="100" />
      <el-table-column prop="deviceName" label="设备名称" width="150" />
      <el-table-column label="状态数据" min-width="200">
        <template #default="scope">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="温度">
              {{ JSON.parse(scope.row.statusData).temperature }}°C
            </el-descriptions-item>
            <el-descriptions-item label="湿度">
              {{ JSON.parse(scope.row.statusData).humidity }}%
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="记录时间" width="180" />
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import axios from 'axios'

const loading = ref(false)
const deviceStats = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filterForm = ref({
  deviceId: '',
  timeRange: []
})

// 获取设备状态数据
const fetchDeviceStats = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/device-stats')
    deviceStats.value = response.data
    total.value = response.data.length
  } catch (error) {
    ElMessage.error('获取设备状态数据失败')
    console.error('Error fetching device stats:', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchDeviceStats()
}

// 过滤数据
const filteredData = computed(() => {
  let result = [...deviceStats.value]

  // 按设备ID过滤
  if (filterForm.value.deviceId) {
    result = result.filter(item => 
      item.deviceId.toString() === filterForm.value.deviceId
    )
  }

  // 按时间范围过滤
  if (filterForm.value.timeRange && filterForm.value.timeRange.length === 2) {
    const [startTime, endTime] = filterForm.value.timeRange
    result = result.filter(item => {
      const itemTime = new Date(item.createdAt)
      return itemTime >= new Date(startTime) && itemTime <= new Date(endTime)
    })
  }

  // 分页处理
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 处理筛选
const handleFilter = () => {
  currentPage.value = 1
}

// 重置筛选
const resetFilter = () => {
  filterForm.value = {
    deviceId: '',
    timeRange: []
  }
  currentPage.value = 1
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

// 组件挂载时获取数据
onMounted(() => {
  fetchDeviceStats()
})
</script>

<style scoped>
.device-stats-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.actions {
  display: flex;
  gap: 10px;
}
</style> 