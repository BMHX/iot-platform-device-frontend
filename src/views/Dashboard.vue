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
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>设备地理分布</span>
            </div>
          </template>
          <div class="map-placeholder">
            地图占位符
          </div>
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
            <div class="chart-placeholder">
              设备状态饼图占位符
            </div>
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
          <div class="svg-chart-container">
            <svg
              :width="svgChartWidth"
              :height="svgChartHeight"
              v-if="onlineDevicesHistory.length > 1"
            >
              <path :d="lineChartPath" class="line-chart-path" fill="none" />
              <text x="10" y="20" class="chart-info-text">
                Min: {{ Math.min(...onlineDevicesHistory) }} | Max:
                {{ Math.max(...onlineDevicesHistory) }}
              </text>
            </svg>
            <div v-else class="chart-placeholder">正在收集数据...</div>
          </div>
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
export default {
  name: "DashboardPage",
  data() {
    return {
      isLoading: false,
      currentTime: new Date().toLocaleTimeString(),
      svgChartWidth: 800,
      svgChartHeight: 300,
      kpis: {
        onlineDevices: 0,
        onlineDevicesChange: 0,
        alarmsToday: 0,
        alarmsTodayChange: 0,
        dataThroughput: 0,
        messageRate: 0,
      },
      deviceStatus: {
        online: 0,
        offline: 0,
        error: 0,
      },
      recentAlarms: [],
      onlineDevicesHistory: [],
      maxHistoryPoints: 20,
      intervalId: null,
      dataUpdateIntervalId: null,
      alarmIdCounter: 1,
    };
  },
  methods: {
    async fetchDashboardData() {
      this.isLoading = true;
      console.log("调用后端API: 获取Dashboard数据");
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // 模拟数据填充
      this.kpis = {
        onlineDevices: 1180,
        onlineDevicesChange: 2,
        alarmsToday: 25,
        alarmsTodayChange: -1,
        dataThroughput: 150.75,
        messageRate: 850,
      };
      this.deviceStatus = {
        online: 1180,
        offline: 55,
        error: 15,
      };
      this.recentAlarms = [
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
      ];
      this.onlineDevicesHistory = [
        1100, 1120, 1110, 1130, 1150, 1140, 1160, 1180,
      ];
      this.isLoading = false;
    },
    updateTime() {
      this.currentTime = new Date().toLocaleTimeString();
    },
    startDynamicUpdates() {
      this.intervalId = setInterval(() => {
        this.updateTime();
      }, 1000);

      this.dataUpdateIntervalId = setInterval(() => {
        this.fetchDashboardData();
      }, 30000);
    },
    stopDynamicUpdates() {
      clearInterval(this.intervalId);
      clearInterval(this.dataUpdateIntervalId);
    },
  },
  computed: {
    normalizedHistory() {
      if (this.onlineDevicesHistory.length === 0) return [];
      const min = Math.min(...this.onlineDevicesHistory);
      const max = Math.max(...this.onlineDevicesHistory);
      if (min === max) return this.onlineDevicesHistory.map(() => 0.5);
      return this.onlineDevicesHistory.map((val) => (val - min) / (max - min));
    },
    lineChartPath() {
      if (this.normalizedHistory.length < 2) return "";
      const padding = 10;
      const chartUsableWidth = this.svgChartWidth - 2 * padding;
      const chartUsableHeight = this.svgChartHeight - 2 * padding;

      let path = `M ${padding},${
        padding + chartUsableHeight * (1 - this.normalizedHistory[0])
      }`;
      const stepX = chartUsableWidth / (this.normalizedHistory.length - 1);

      for (let i = 1; i < this.normalizedHistory.length; i++) {
        const x = padding + i * stepX;
        const y = padding + chartUsableHeight * (1 - this.normalizedHistory[i]);
        path += ` L ${x},${y}`;
      }
      return path;
    },
  },
  mounted() {
    this.fetchDashboardData();
    this.startDynamicUpdates();
    
    // 响应式调整图表大小
    const updateChartSize = () => {
      const chartContainer = document.querySelector('.svg-chart-container');
      if (chartContainer) {
        this.svgChartWidth = chartContainer.offsetWidth - 20;
        this.svgChartHeight = 300;
      }
    };
    
    window.addEventListener('resize', updateChartSize);
    this.$nextTick(() => {
      updateChartSize();
    });
  },
  beforeUnmount() {
    this.stopDynamicUpdates();
    window.removeEventListener('resize', this.updateChartSize);
  },
};
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

.map-placeholder {
  height: 300px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  border-radius: 4px;
}

.status-overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  .status-item {
    margin-bottom: 5px;
  }
  
  .chart-placeholder {
    height: 200px;
    background-color: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    border-radius: 4px;
    margin-top: 10px;
  }
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
</style>
