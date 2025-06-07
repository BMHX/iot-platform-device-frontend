<template>
  <div class="page-container">
    <el-row :gutter="20" class="dashboard-header">
      <el-col :span="12">
        <h1>物联监控大屏</h1>
      </el-col>
      <el-col :span="12" class="text-right">
        <div class="current-time">{{ currentTime }}</div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>在线设备数</span>
              <el-tag :type="kpis.onlineDevicesChange >= 0 ? 'success' : 'danger'" size="small">
                {{ kpis.onlineDevicesChange >= 0 ? "+" : "" }}{{ kpis.onlineDevicesChange }}
              </el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="kpi-value">{{ kpis.onlineDevices }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>今日告警数</span>
              <el-tag :type="kpis.alarmsTodayChange >= 0 ? 'warning' : 'success'" size="small">
                {{ kpis.alarmsTodayChange >= 0 ? "+" : "" }}{{ kpis.alarmsTodayChange }}
              </el-tag>
            </div>
          </template>
          <div class="card-body">
            <div class="kpi-value">{{ kpis.alarmsToday }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>数据吞吐量 (Mbps)</span>
            </div>
          </template>
          <div class="card-body">
            <div class="kpi-value">{{ kpis.dataThroughput.toFixed(2) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>消息处理量 (条/秒)</span>
            </div>
          </template>
          <div class="card-body">
            <div class="kpi-value">{{ kpis.messageRate }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="16">
        <el-card class="map-card">
          <template #header>
            <div class="card-header">
              <span>设备地理分布</span>
            </div>
          </template>
          <div id="deviceMap" class="map-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>设备状态概览</span>
            </div>
          </template>
          <div class="status-overview">
            <div class="status-item">
              <el-tag type="success">在线: {{ deviceStatus.online }}</el-tag>
            </div>
            <div class="status-item">
              <el-tag type="info">离线: {{ deviceStatus.offline }}</el-tag>
            </div>
            <div class="status-item">
              <el-tag type="danger">故障: {{ deviceStatus.error }}</el-tag>
            </div>
            <div id="deviceStatusChart" style="width: 100%; height: 200px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>在线设备数趋势</span>
            </div>
          </template>
          <div id="onlineDevicesTrendChart" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>最新告警信息</span>
            </div>
          </template>
          <el-table :data="recentAlarms" style="width: 100%" size="small">
            <el-table-column prop="time" label="时间" width="80" />
            <el-table-column prop="content" label="告警内容" />
            <el-table-column prop="level" label="级别" width="80">
              <template #default="scope">
                <el-tag
                  :type="scope.row.level === 'high' ? 'danger' : scope.row.level === 'medium' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ scope.row.level === 'high' ? '高' : scope.row.level === 'medium' ? '中' : '低' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import request from '@/api/request'
import * as echarts from 'echarts'

export default {
  name: "DashboardPage",
  setup() {
    const isLoading = ref(false)
    const currentTime = ref(new Date().toLocaleTimeString())
    const svgChartWidth = ref(800)
    const svgChartHeight = ref(300)
    const kpis = ref({
        onlineDevices: 0,
        onlineDevicesChange: 0,
        alarmsToday: 0,
        alarmsTodayChange: 0,
        dataThroughput: 0,
        messageRate: 0,
    })
    const deviceStatus = ref({
        online: 0,
        offline: 0,
        error: 0,
    })
    const recentAlarms = ref([])
    const onlineDevicesHistory = ref([])
    const maxHistoryPoints = 100
    const intervalId = ref(null)
    const dataUpdateIntervalId = ref(null)
    const alarmIdCounter = ref(1)
    const trendChart = ref(null)

    // 设备列表数据
    const deviceList = ref([])

    // 初始化设备状态饼图
    const initDeviceStatusChart = () => {
      const chartDom = document.getElementById('deviceStatusChart')
      if (!chartDom) return

      const myChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: ['在线', '离线', '故障']
        },
        series: [
          {
            name: '设备状态',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '20',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: deviceStatus.value.online, name: '在线', itemStyle: { color: '#67C23A' } },
              { value: deviceStatus.value.offline, name: '离线', itemStyle: { color: '#909399' } },
              { value: deviceStatus.value.error, name: '故障', itemStyle: { color: '#F56C6C' } }
            ]
          }
        ]
      }

      myChart.setOption(option)
    }

    // 初始化在线设备趋势图
    const initTrendChart = () => {
      const chartDom = document.getElementById('onlineDevicesTrendChart')
      if (!chartDom) return

      trendChart.value = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const time = params[0].axisValue
            const value = params[0].value
            return `${time}<br/>在线设备数: ${value}`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        dataZoom: [
          {
            type: 'slider',
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: 100,
            bottom: 10
          },
          {
            type: 'inside',
            xAxisIndex: [0],
            start: 0,
            end: 100
          }
        ],
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: [],
          axisLabel: {
            rotate: 45,
            formatter: function(value) {
              // 只显示时分秒，避免标签太长
              return value.split(' ')[1]
            }
          }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        series: [
          {
            name: '在线设备数',
            type: 'line',
            smooth: true,
            data: [],
            areaStyle: {
              opacity: 0.1
            },
            lineStyle: {
              width: 3
            },
            itemStyle: {
              color: '#67C23A'
            },
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            },
            markLine: {
              data: [
                { type: 'average', name: '平均值' }
              ]
            }
          }
        ]
      }

      trendChart.value.setOption(option)
    }

    // 更新趋势图数据
    const updateTrendChart = () => {
      if (!trendChart.value) return

      const now = new Date()
      const timeStr = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-')
      
      // 从localStorage获取历史数据
      let history = JSON.parse(localStorage.getItem('onlineDevicesHistory') || '[]')
      
      // 添加新的数据点
      history.push({
        time: timeStr,
        value: kpis.value.onlineDevices
      })

      // 保持最近100个数据点
      if (history.length > maxHistoryPoints) {
        history = history.slice(-maxHistoryPoints)
      }

      // 保存到localStorage
      localStorage.setItem('onlineDevicesHistory', JSON.stringify(history))
      
      // 更新本地数据
      onlineDevicesHistory.value = history

      // 更新图表
      const option = {
        xAxis: {
          data: history.map(item => item.time)
        },
        series: [{
          data: history.map(item => item.value)
        }]
      }

      trendChart.value.setOption(option)
    }

    // 获取设备列表
    const getDeviceList = async () => {
      try {
        const adminId = localStorage.getItem('adminId')
        const response = await request.get(`/api/device/admin/${adminId}`)
        if (response.code === 0) {
          deviceList.value = response.data
          // 统计设备状态
          const statusCount = {
            online: 0,
            offline: 0,
            error: 0
          }
          deviceList.value.forEach(device => {
            switch (device.status) {
              case 1:
                statusCount.online++
                break
              case 0:
                statusCount.offline++
                break
              case 2:
                statusCount.error++
                break
            }
          })
          // 更新设备状态数据
          deviceStatus.value = statusCount
          // 计算在线设备变化率
          const currentOnlineDevices = statusCount.online
          // 从localStorage获取上一次的在线设备数
          const lastOnlineDevices = parseInt(localStorage.getItem('lastOnlineDevices') || '0')
          console.log('当前在线设备数:', currentOnlineDevices)
          console.log('上一次在线设备数:', lastOnlineDevices)
          // 计算变化率
          kpis.value.onlineDevicesChange = currentOnlineDevices - lastOnlineDevices
          console.log('变化率:', kpis.value.onlineDevicesChange)
          // 只在第一次加载时更新localStorage
          if (!localStorage.getItem('lastOnlineDevices')) {
            localStorage.setItem('lastOnlineDevices', currentOnlineDevices.toString())
          }
          // 更新在线设备数量
          kpis.value.onlineDevices = currentOnlineDevices
          // 更新趋势图
          updateTrendChart()
          // 初始化地图
          initMap()
          // 初始化设备状态饼图
          initDeviceStatusChart()
        }
      } catch (error) {
        console.error('获取设备列表失败:', error)
      }
    }

    // 监听设备状态变化
    watch(() => kpis.value.onlineDevices, (newValue, oldValue) => {
      if (newValue !== oldValue) {
        console.log('设备状态变化，更新趋势图')
        updateTrendChart()
      }
    })

    // 初始化地图
    const initMap = () => {
      // 确保AMap已加载
      if (window.AMap) {
        const map = new window.AMap.Map('deviceMap', {
          zoom: 5,
          center: [116.397428, 39.90923] // 默认中心点
        })

        // 添加设备标记
        deviceList.value.forEach(device => {
          if (device.latitude && device.longitude) {
            const marker = new window.AMap.Marker({
              position: [parseFloat(device.longitude), parseFloat(device.latitude)],
              title: device.deviceName
            })

            // 创建信息窗体
            const infoWindow = new window.AMap.InfoWindow({
              content: `
                <div class="device-info">
                  <h4>${device.deviceName}</h4>
                  <p>设备类型：${device.deviceType}</p>
                  <p>状态：${device.status === 1 ? '在线' : '离线'}</p>
                </div>
              `,
              offset: new window.AMap.Pixel(0, -30)
            })

            // 点击标记时打开信息窗体
            marker.on('click', () => {
              infoWindow.open(map, marker.getPosition())
            })

            marker.setMap(map)
          }
        })
      }
    }

    // 加载高德地图
    const loadAMap = () => {
      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=2.0&key=ea84ad3d0c26a693771f05407a839945`
      script.async = true
      script.onload = () => {
        getDeviceList()
      }
      document.head.appendChild(script)
    }

    // 启动动态更新
    const startDynamicUpdates = () => {
      // 只更新时间显示
      intervalId.value = setInterval(() => {
        currentTime.value = new Date().toLocaleTimeString()
      }, 1000)

      // 每10秒更新一次数据
      dataUpdateIntervalId.value = setInterval(() => {
        getDeviceList()
      }, 10000)
    }

    // 在组件挂载时加载地图
    onMounted(() => {
      loadAMap()
      // 初始化趋势图
      initTrendChart()
      // 立即获取一次数据
      getDeviceList()
      // 启动动态更新
      startDynamicUpdates()
    })

    const fetchDashboardData = async () => {
      isLoading.value = true
      console.log("调用后端API: 获取Dashboard数据")
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // 模拟数据填充
      kpis.value = {
        onlineDevices: 1180,
        onlineDevicesChange: 2,
        alarmsToday: 25,
        alarmsTodayChange: -1,
        dataThroughput: 150.75,
        messageRate: 850,
      }
      deviceStatus.value = {
        online: 1180,
        offline: 55,
        error: 15,
      }
      recentAlarms.value = [
        {
          id: 1,
          time: "10:35:12",
          level: "high",
          content: "1号厂房温度超高",
          device: "传感器T001",
        },
        {
          id: 2,
          time: "10:33:45",
          level: "medium",
          content: "设备SN0023离线",
          device: "摄像头C002",
        },
        {
          id: 3,
          time: "10:30:22",
          level: "low",
          content: "电池电量低",
          device: "网关G005",
        },
      ]
      onlineDevicesHistory.value = [
        1100, 1120, 1110, 1130, 1150, 1140, 1160, 1180,
      ]
      isLoading.value = false
    }

    const updateTime = () => {
      currentTime.value = new Date().toLocaleTimeString()
    }

    const stopDynamicUpdates = () => {
      if (intervalId.value) {
        clearInterval(intervalId.value)
      }
      if (dataUpdateIntervalId.value) {
        clearInterval(dataUpdateIntervalId.value)
      }
    }

    const normalizedHistory = () => {
      if (onlineDevicesHistory.value.length === 0) return []
      const min = Math.min(...onlineDevicesHistory.value.map(item => item.value))
      const max = Math.max(...onlineDevicesHistory.value.map(item => item.value))
      if (min === max) return onlineDevicesHistory.value.map(() => 0.5)
      return onlineDevicesHistory.value.map((item) => (item.value - min) / (max - min))
    }

    const lineChartPath = () => {
      if (normalizedHistory().length < 2) return ""
      const padding = 10
      const chartUsableWidth = svgChartWidth.value - 2 * padding
      const chartUsableHeight = svgChartHeight.value - 2 * padding

      let path = `M ${padding},${
        padding + chartUsableHeight * (1 - normalizedHistory()[0])
      }`
      const stepX = chartUsableWidth / (normalizedHistory().length - 1)

      for (let i = 1; i < normalizedHistory().length; i++) {
        const x = padding + i * stepX
        const y = padding + chartUsableHeight * (1 - normalizedHistory()[i])
        path += ` L ${x},${y}`
      }
      return path
    }

    // 组件卸载时清理
    onUnmounted(() => {
      if (trendChart.value) {
        trendChart.value.dispose()
      }
      if (intervalId.value) {
        clearInterval(intervalId.value)
      }
      if (dataUpdateIntervalId.value) {
        clearInterval(dataUpdateIntervalId.value)
      }
    })

    return {
      isLoading,
      currentTime,
      svgChartWidth,
      svgChartHeight,
      kpis,
      deviceStatus,
      recentAlarms,
      onlineDevicesHistory,
      maxHistoryPoints,
      normalizedHistory,
      lineChartPath,
      startDynamicUpdates,
      stopDynamicUpdates,
    }
  },
  mounted() {
    this.startDynamicUpdates()
    
    // 响应式调整图表大小
    const updateChartSize = () => {
      const chartContainer = document.querySelector('.svg-chart-container')
      if (chartContainer) {
        this.svgChartWidth = chartContainer.offsetWidth - 20
        this.svgChartHeight = 300
      }
      // 更新设备状态饼图大小
      const deviceStatusChart = echarts.getInstanceByDom(document.getElementById('deviceStatusChart'))
      if (deviceStatusChart) {
        deviceStatusChart.resize()
      }
    }
    
    window.addEventListener('resize', updateChartSize)
    this.$nextTick(() => {
      updateChartSize()
    })
  },
  beforeUnmount() {
    this.stopDynamicUpdates()
    window.removeEventListener('resize', this.updateChartSize)
    // 销毁设备状态饼图实例
    const deviceStatusChart = echarts.getInstanceByDom(document.getElementById('deviceStatusChart'))
    if (deviceStatusChart) {
      deviceStatusChart.dispose()
    }
  },
}
</script>

<style lang="scss" scoped>
.dashboard-header {
  margin-bottom: 20px;
  
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 500;
  }
  
  .current-time {
    font-size: 18px;
    color: #606266;
    text-align: right;
  }
}

.mb-20 {
  margin-bottom: 20px;
}

.text-right {
  text-align: right;
}

.kpi-value {
  font-size: 36px;
  font-weight: 600;
  color: #409EFF;
  text-align: center;
  margin-top: 10px;
}

.chart-card {
  height: 100%;
}

.map-container {
  height: 500px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}

.device-info {
  padding: 10px;
}

.device-info h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.device-info p {
  margin: 5px 0;
  color: #666;
}

.status-overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}
  
  .status-item {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

#deviceStatusChart {
  margin-top: 20px;
}

.svg-chart-container {
  height: 300px;
  width: 100%;
  
  svg {
    width: 100%;
    height: 100%;
  }
  
  .line-chart-path {
    stroke: #409EFF;
    stroke-width: 2;
  }
  
  .chart-info-text {
    fill: #606266;
    font-size: 12px;
  }
}

#onlineDevicesTrendChart {
  margin-top: 10px;
}
</style>
