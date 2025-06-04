<template>
  <div class="alarm-page-styles">
    <!-- 添加这个类名 -->
    <div class="alarm-page">
      <h2 class="page-title">告警管理</h2>

      <div class="filter-controls">
        <label for="status-filter">状态筛选:</label>
        <select
          id="status-filter"
          v-model="selectedStatus"
          @change="filterAlarms"
        >
          <option value="all">全部</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
        </select>
      </div>

      <div class="alarm-summary">
        <p>
          当前告警总数: {{ filteredAlarms.length }} (待处理:
          {{ pendingAlarmsCount }}, 处理中: {{ processingAlarmsCount }}, 已解决:
          {{ resolvedAlarmsCount }})
        </p>
      </div>

      <table class="alarm-table">
        <thead>
          <tr>
            <th>告警ID</th>
            <th>告警级别</th>
            <th>告警时间</th>
            <th>设备名称</th>
            <th>告警内容</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredAlarms.length === 0">
            <td colspan="7" class="no-data">暂无告警信息</td>
          </tr>
          <tr
            v-for="alarm in filteredAlarms"
            :key="alarm.id"
            :class="getAlarmRowClass(alarm)"
          >
            <td>{{ alarm.id }}</td>
            <td>
              <span
                :class="['alarm-level-tag', getAlarmLevelClass(alarm.level)]"
              >
                {{ alarm.level }}
              </span>
            </td>
            <td>{{ formatDate(alarm.time) }}</td>
            <td>{{ alarm.device }}</td>
            <td>{{ alarm.content }}</td>
            <td>{{ getStatusText(alarm.status) }}</td>
            <td>
              <button
                @click="handleAlarm(alarm)"
                class="action-btn process-btn"
                :disabled="
                  alarm.status === 'resolved' || alarm.status === 'processing'
                "
              >
                处理
              </button>
              <button
                @click="resolveAlarm(alarm)"
                class="action-btn resolve-btn"
                :disabled="alarm.status === 'resolved'"
              >
                解决
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <!-- 对应 alarm-page-styles 的结束标签 -->
</template>

<script>
// import axios from 'axios'; // 移除了 axios 的导入

export default {
  name: "AlarmPage",
  data() {
    return {
      isLoading: false, // 新增加载状态
      selectedStatus: "all",
      alarms: [], // 初始化为空数组
    };
  },
  computed: {
    filteredAlarms() {
      if (this.selectedStatus === "all") {
        return this.alarms;
      }
      return this.alarms.filter(
        (alarm) => alarm.status === this.selectedStatus
      );
    },
    pendingAlarmsCount() {
      return this.alarms.filter((alarm) => alarm.status === "pending").length;
    },
    processingAlarmsCount() {
      return this.alarms.filter((alarm) => alarm.status === "processing")
        .length;
    },
    resolvedAlarmsCount() {
      return this.alarms.filter((alarm) => alarm.status === "resolved").length;
    },
  },
  methods: {
    async fetchAlarms() {
      this.isLoading = true;
      console.log("调用后端API: 获取告警列表");
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // 实际场景中，您会用axios或其他HTTP客户端替换这里
      // const response = await fetch('/api/alarms');
      // const data = await response.json();
      // this.alarms = data.map(alarm => ({...alarm, time: new Date(alarm.time)}));
      this.alarms = [
        {
          id: "A001",
          level: "严重",
          time: new Date("2024-07-20T10:30:00"),
          device: "传感器S01",
          content: "设备过热，温度达到阈值上限",
          status: "pending",
        },
        {
          id: "A002",
          level: "警告",
          time: new Date("2024-07-20T11:15:00"),
          device: "摄像头C02",
          content: "设备故障，无法连接网络",
          status: "pending",
        },
        {
          id: "A003",
          level: "一般",
          time: new Date("2024-07-19T14:00:00"),
          device: "执行器A05",
          content: "设备响应延迟",
          status: "processing",
        },
        {
          id: "A004",
          level: "严重",
          time: new Date("2024-07-19T09:00:00"),
          device: "服务器SRV1",
          content: "设备过热，CPU温度异常",
          status: "resolved",
        },
      ];
      this.isLoading = false;
    },
    formatDate(date) {
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    getStatusText(status) {
      const statusMap = {
        pending: "待处理",
        processing: "处理中",
        resolved: "已解决",
      };
      return statusMap[status] || "未知";
    },
    getAlarmLevelClass(level) {
      if (level === "严重") return "level-critical";
      if (level === "警告") return "level-warning";
      if (level === "一般") return "level-info";
      return "";
    },
    getAlarmRowClass(alarm) {
      if (alarm.status === "resolved") return "status-resolved-row";
      return "";
    },
    filterAlarms() {
      // The computed property `filteredAlarms` will update automatically
    },
    async handleAlarm(alarm) {
      console.log("调用后端API: 处理告警", alarm.id);
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      // await fetch(`/api/alarms/${alarm.id}/handle`, { method: 'POST' });
      const index = this.alarms.findIndex((a) => a.id === alarm.id);
      if (index !== -1 && this.alarms[index].status === "pending") {
        this.alarms[index].status = "processing"; // 乐观更新或在API成功后更新
      }
    },
    async resolveAlarm(alarm) {
      console.log("调用后端API: 解决告警", alarm.id);
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      // await fetch(`/api/alarms/${alarm.id}/resolve`, { method: 'POST' });
      const index = this.alarms.findIndex((a) => a.id === alarm.id);
      if (index !== -1) {
        this.alarms[index].status = "resolved"; // 乐观更新或在API成功后更新
      }
    },
  },
  mounted() {
    this.fetchAlarms(); // 组件挂载后获取告警数据
  },
};
</script>

<style lang="scss">
@use "@/assets/navHeaderStyles.scss"; // 引入全局样式文件
</style>
