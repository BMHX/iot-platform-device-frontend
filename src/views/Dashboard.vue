<template>
  <div class="dashboard-page dashboard-page-styles"> <!-- Add dashboard-page-styles class here -->
    <header class="dashboard-header">
      <h1>物联监控大屏</h1>
      <div class="current-time">{{ currentTime }}</div>
    </header>

    <div class="dashboard-grid">
      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <h3>在线设备数</h3>
          <p class="kpi-value">{{ kpis.onlineDevices }}</p>
          <span
            :class="[
              'kpi-change',
              kpis.onlineDevicesChange >= 0 ? 'positive' : 'negative',
            ]"
          >
            {{ kpis.onlineDevicesChange >= 0 ? "+" : ""
            }}{{ kpis.onlineDevicesChange }}
          </span>
        </div>
        <div class="kpi-card">
          <h3>今日告警数</h3>
          <p class="kpi-value">{{ kpis.alarmsToday }}</p>
          <span
            :class="[
              'kpi-change',
              kpis.alarmsTodayChange >= 0 ? 'positive' : 'negative',
            ]"
          >
            {{ kpis.alarmsTodayChange >= 0 ? "+" : ""
            }}{{ kpis.alarmsTodayChange }}
          </span>
        </div>
        <div class="kpi-card">
          <h3>数据吞吐量 (Mbps)</h3>
          <p class="kpi-value">{{ kpis.dataThroughput.toFixed(2) }}</p>
        </div>
        <div class="kpi-card">
          <h3>消息处理量 (条/秒)</h3>
          <p class="kpi-value">{{ kpis.messageRate }}</p>
        </div>
      </div>

      <!-- Device Status & Map -->
      <div class="chart-card large-card device-status-map">
        <div class="device-status-section">
          <h4>设备状态概览</h4>
          <div class="status-item">
            <span class="status-dot online"></span>在线:
            {{ deviceStatus.online }}
          </div>
          <div class="status-item">
            <span class="status-dot offline"></span>离线:
            {{ deviceStatus.offline }}
          </div>
          <div class="status-item">
            <span class="status-dot error"></span>故障: {{ deviceStatus.error }}
          </div>
          <div class="chart-placeholder tall-placeholder">
            设备状态饼图占位符
          </div>
        </div>
        <div class="map-section">
          <h4>设备地理分布</h4>
          <div class="chart-placeholder map-placeholder">地图占位符</div>
        </div>
      </div>

      <!-- Data Trend Chart -->
      <div class="chart-card line-chart-card">
        <h4>在线设备数趋势</h4>
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
      </div>

      <!-- Recent Alarms -->
      <div class="chart-card recent-alarms">
        <h4>最新告警信息</h4>
        <ul class="alarm-list">
          <li
            v-for="alarm in recentAlarms"
            :key="alarm.id"
            :class="['alarm-item', alarm.level]"
          >
            <span class="alarm-time">[{{ alarm.time }}]</span>
            <span class="alarm-content"
              >{{ alarm.content }} - {{ alarm.device }}</span
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DashboardPage",
  data() {
    return {
      isLoading: false, // 新增加载状态
      currentTime: new Date().toLocaleTimeString(),
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
      dataUpdateIntervalId: null, // 用于后台数据获取的定时器
      alarmIdCounter: 1, // 确保从1开始或从API获取
    };
  },
  methods: {
    async fetchDashboardData() {
      this.isLoading = true;
      console.log("调用后端API: 获取Dashboard数据");
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // const response = await fetch('/api/dashboard-data');
      // const data = await response.json();
      // this.kpis = data.kpis;
      // this.deviceStatus = data.deviceStatus;
      // this.recentAlarms = data.recentAlarms;
      // this.onlineDevicesHistory = data.onlineDevicesHistory || [];
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
      ];
      this.onlineDevicesHistory = [
        1100, 1120, 1110, 1130, 1150, 1140, 1160, 1180,
      ];
      this.isLoading = false;
    },
    updateTime() {
      this.currentTime = new Date().toLocaleTimeString();
    },
    // updateKpis, updateDeviceStatus, addRandomAlarm 可能会被后端数据替代或调整
    // 这里保留 updateTime 和启动/停止定时器的逻辑，但数据更新主要依赖 fetchDashboardData
    startDynamicUpdates() {
      this.intervalId = setInterval(() => {
        this.updateTime();
      }, 1000); // 仅更新时间

      // 定时从后端获取最新数据
      this.dataUpdateIntervalId = setInterval(() => {
        this.fetchDashboardData();
      }, 30000); // 例如每30秒更新一次数据
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
      // 避免除以零，如果所有值都相同，则将它们归一化到中间位置
      if (min === max) return this.onlineDevicesHistory.map(() => 0.5);
      return this.onlineDevicesHistory.map((val) => (val - min) / (max - min));
    },
    lineChartPath() {
      if (this.normalizedHistory.length < 2) return "";
      const padding = 10; // 内边距
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
    this.fetchDashboardData(); // 初始加载数据
    this.startDynamicUpdates();
  },
  beforeUnmount() {
    // Vue 3是 beforeUnmount, Vue 2是 beforeDestroy
    this.stopDynamicUpdates();
  },
};
</script>

<style lang="scss">
@use "@/assets/navHeaderStyles.scss"; // Or @import, if @use is not configured
</style>
