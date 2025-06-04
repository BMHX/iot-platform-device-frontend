<template>
  <div class="statistics-page-styles">
    <div v-if="hasPermission">
      <!-- 页面头部，包含标题和操作区域 -->
      <header class="page-header">
        <h1>统计分析</h1>
        <div class="actions">
          <select v-model="selectedTimeRange" @change="fetchAllStatisticsData">
            <option value="last24h">过去24小时</option>
            <option value="last7d">过去7天</option>
            <option value="last30d">过去30天</option>
          </select>
          <button class="export-btn" @click="exportReport">导出报告</button>
        </div>
      </header>

      <!-- 汇总卡片 -->
      <div class="summary-cards">
        <div class="summary-card">
          <h3>总设备数</h3>
          <p class="count">{{ summaryData.totalDevices }}</p>
        </div>
        <div class="summary-card">
          <h3>累计告警数</h3>
          <p class="count">{{ summaryData.totalAlarms }}</p>
          <span
            :class="[
              'change',
              summaryData.alarmChange >= 0 ? 'positive' : 'negative',
            ]"
          >
            {{ summaryData.alarmChange >= 0 ? "+" : ""
            }}{{ summaryData.alarmChange }}% (较上周期)
          </span>
        </div>
        <div class="summary-card">
          <h3>数据存储量 (GB)</h3>
          <p class="count">{{ summaryData.dataStorage }}</p>
        </div>
        <div class="summary-card">
          <h3>在线设备率</h3>
          <p class="count">{{ summaryData.onlineRate }}%</p>
        </div>
      </div>

      <!-- 图表网格 -->
      <div class="charts-grid">
        <div class="chart-container">
          <h4>设备类型分布</h4>
          <div class="chart-placeholder">饼图占位符 (设备类型)</div>
          <!-- <canvas id="deviceTypeChart"></canvas> -->
        </div>
        <div class="chart-container">
          <h4>告警趋势分析 ({{ selectedTimeRangeText }})</h4>
          <div class="chart-placeholder">折线图占位符 (告警趋势)</div>
          <!-- <canvas id="alarmTrendChart"></canvas> -->
        </div>
        <div class="chart-container">
          <h4>数据流量统计 (Top 5 设备)</h4>
          <div class="chart-placeholder">柱状图占位符 (数据流量)</div>
          <!-- <canvas id="dataTrafficChart"></canvas> -->
        </div>
        <div class="chart-container">
          <h4>活跃设备地理分布</h4>
          <div class="chart-placeholder">地图占位符 (地理分布)</div>
          <!-- <div id="deviceLocationMap" style="height: 280px;"></div> -->
        </div>
      </div>
    </div>
    <div v-else class="no-permission-message">
      <h2>权限不足</h2>
      <p>抱歉，您没有访问此页面的权限。</p>
    </div>
  </div>
</template>

<script>
import { useRoute } from "vue-router"; // 引入 useRoute
import { computed } from "vue"; // 引入 computed

export default {
  name: "StatisticsPage",
  setup() {
    // 改用 setup 函数以使用 Composition API
    const route = useRoute();
    const hasPermission = computed(() => route.meta.hasPermission === true);

    // 将原 data 中的属性移到 setup 中并用 ref 或 reactive 包裹
    // 这里为了简化，我将直接在返回对象中定义，但对于复杂状态建议使用 ref
    const selectedTimeRange = "last7d"; // 默认值，后续可以改为 ref
    const summaryData = {
      totalDevices: 0,
      totalAlarms: 0,
      alarmChange: 0,
      dataStorage: 0,
      onlineRate: 0,
    }; // 默认值，后续可以改为 reactive
    // ... 其他 data 属性也需要类似处理

    return {
      hasPermission,
      // 需要将 data, computed, methods 中的内容迁移到 setup 中或保持 Options API 结构并调整
      // 为保持示例简洁，此处仅展示 hasPermission 的集成
      // 您需要将原有的 data, computed, methods 迁移或适配
      selectedTimeRange, // 示例，实际应为 ref
      summaryData, // 示例，实际应为 reactive
      // selectedTimeRangeText, // 需要重新实现为 computed
      // fetchAllStatisticsData, // 需要重新实现为 method
      // loadChartData,
      // generateDeviceTypeData,
      // generateAlarmTrendData,
      // generateDataTrafficData,
      // exportReport,
    };
  },
  // 如果您想继续使用 Options API，可以这样获取 hasPermission:
  // computed: {
  //   hasPermission() {
  //     return this.$route.meta.hasPermission === true;
  //   },
  //   selectedTimeRangeText() { ... existing computed ... },
  // },
  data() {
    return {
      isLoading: false,
      selectedTimeRange: "last7d",
      summaryData: {
        totalDevices: 0,
        totalAlarms: 0,
        alarmChange: 0,
        dataStorage: 0,
        onlineRate: 0,
      },
      deviceTypeData: { labels: [], datasets: [] },
      alarmTrendData: { labels: [], datasets: [] },
      dataTrafficData: { labels: [], datasets: [] },
    };
  },
  computed: {
    // 如果不使用 setup，则在这里定义 hasPermission
    hasPermission() {
      return this.$route.meta.hasPermission === true;
    },
    selectedTimeRangeText() {
      const ranges = {
        last24h: "过去24小时",
        last7d: "过去7天",
        last30d: "过去30天",
      };
      return ranges[this.selectedTimeRange] || "";
    },
  },
  methods: {
    async fetchAllStatisticsData() {
      if (!this.hasPermission) return; // 如果没有权限，不加载数据
      this.isLoading = true;
      console.log(`调用后端API: 获取统计数据 (${this.selectedTimeRangeText})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.summaryData = {
        totalDevices: 1250,
        totalAlarms: 582,
        alarmChange: -5.2,
        dataStorage: 780.5,
        onlineRate: 92.5,
      };
      this.deviceTypeData = this.generateDeviceTypeData();
      this.alarmTrendData = this.generateAlarmTrendData();
      this.dataTrafficData = this.generateDataTrafficData();
      this.isLoading = false;
    },
    loadChartData() {
      this.fetchAllStatisticsData();
    },
    generateDeviceTypeData() {
      return {
        labels: ["传感器", "摄像头", "执行器", "网关", "其他"],
        datasets: [
          {
            data: [300, 250, 150, 100, 50],
            backgroundColor: [
              "#4CAF50",
              "#2196F3",
              "#FFC107",
              "#E91E63",
              "#9E9E9E",
            ],
          },
        ],
      };
    },
    generateAlarmTrendData() {
      let labels = [];
      let data = [];
      let days = 7;
      if (this.selectedTimeRange === "last24h") days = 1;
      if (this.selectedTimeRange === "last30d") days = 30;

      for (
        let i = 0;
        i < (this.selectedTimeRange === "last24h" ? 24 : days);
        i++
      ) {
        if (this.selectedTimeRange === "last24h") {
          labels.push(`${i}:00`);
        } else {
          labels.push(`Day ${i + 1}`);
        }
        data.push(Math.floor(Math.random() * 50) + 10);
      }
      return {
        labels,
        datasets: [
          { label: "告警数", data, borderColor: "#f87979", tension: 0.1 },
        ],
      };
    },
    generateDataTrafficData() {
      return {
        labels: ["设备A", "设备B", "设备C", "设备D", "设备E"],
        datasets: [
          {
            label: "数据流量(MB)",
            data: [120, 90, 75, 60, 40],
            backgroundColor: "#8884d8",
          },
        ],
      };
    },
    exportReport() {
      alert("导出报告功能暂未实现。");
    },
  },
  watch: {
    selectedTimeRange() {
      if (this.hasPermission) {
        // 仅在有权限时响应变化
        this.fetchAllStatisticsData();
      }
    },
    // 监听路由变化，确保在直接导航到此页面（非首次加载）时也能正确判断权限
    "$route.meta.hasPermission"(newVal, oldVal) {
      if (newVal === true && !oldVal) {
        // 如果权限从无到有（例如，通过某种方式刷新了权限状态并重新评估了路由）
        this.fetchAllStatisticsData();
      }
    },
  },
  mounted() {
    if (this.hasPermission) {
      this.fetchAllStatisticsData();
    }
  },
};
</script>

<style lang="scss" scoped>
/* 保持您原有的样式 */
.statistics-page-styles {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 10px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.summary-card h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1em;
  color: #555;
}

.summary-card .count {
  font-size: 2em;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.summary-card .change {
  font-size: 0.9em;
}

.summary-card .change.positive {
  color: green;
}

.summary-card .change.negative {
  color: red;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.chart-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-container h4 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 15px;
}

.chart-placeholder {
  min-height: 200px; /* 或者根据您的图表实际高度调整 */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 4px;
  color: #777;
}

.no-permission-message {
  text-align: center;
  padding: 50px;
  color: #777;
}
.no-permission-message h2 {
  color: #dc3545;
  margin-bottom: 10px;
}

.export-btn {
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.export-btn:hover {
  background-color: #0056b3;
}

select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
</style>
