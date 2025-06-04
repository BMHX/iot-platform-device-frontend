<template>
  <div class="connect-page connect-page-styles">  <!-- Add connect-page-styles class here -->
    <h2 class="page-title">设备对接管理</h2>

    <div class="filter-controls">
      <label for="status-filter">筛选状态:</label>
      <select id="status-filter" v-model="selectedStatusFilter">
        <option value="all">全部请求</option>
        <option value="pending">待处理</option>
        <option value="approved">已同意</option>
        <option value="rejected">已拒绝</option>
      </select>
    </div>

    <div v-if="filteredRequests.length === 0" class="no-requests">
      <p>当前没有符合条件的对接请求。</p>
    </div>

    <div class="requests-grid">
      <div
        v-for="request in filteredRequests"
        :key="request.id"
        class="request-card"
        :class="getCardStatusClass(request.status)"
      >
        <div class="card-header">
          <span class="protocol-icon">[{{ request.protocol }}]</span>
          <h3 class="device-name">{{ request.deviceName }}</h3>
          <span
            class="request-status-tag"
            :class="getStatusTagClass(request.status)"
            >{{ getStatusText(request.status) }}</span
          >
        </div>
        <div class="card-body">
          <p><strong>请求ID:</strong> {{ request.id }}</p>
          <p><strong>来源平台:</strong> {{ request.sourcePlatform }}</p>
          <p>
            <strong>请求时间:</strong> {{ formatDate(request.requestTime) }}
          </p>
          <p v-if="request.processedTime">
            <strong>处理时间:</strong> {{ formatDate(request.processedTime) }}
          </p>
        </div>
        <div class="card-footer" v-if="request.status === 'pending'">
          <button
            @click="approveRequest(request.id)"
            class="action-btn approve-btn"
          >
            同意对接
          </button>
          <button
            @click="rejectRequest(request.id)"
            class="action-btn reject-btn"
          >
            拒绝请求
          </button>
        </div>
        <div class="card-footer processed-footer" v-else>
          <p>请求已于 {{ formatDate(request.processedTime) }} 处理</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ConnectPage",
  data() {
    return {
      isLoading: false, // 新增加载状态
      selectedStatusFilter: "all",
      connectionRequests: [], // 初始化为空数组
    };
  },
  computed: {
    filteredRequests() {
      if (this.selectedStatusFilter === "all") {
        return this.connectionRequests.sort(
          (a, b) => b.requestTime - a.requestTime
        );
      }
      return this.connectionRequests
        .filter((req) => req.status === this.selectedStatusFilter)
        .sort((a, b) => b.requestTime - a.requestTime);
    },
  },
  methods: {
    async fetchConnectionRequests() {
      this.isLoading = true;
      console.log("调用后端API: 获取设备对接请求列表");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.connectionRequests = [
        {
          id: "REQ001",
          deviceName: "智能环境监测仪",
          sourcePlatform: "Alpha环境监测云",
          protocol: "MQTT",
          requestTime: new Date("2024-07-21T10:00:00"),
          status: "pending",
          processedTime: null,
          deviceDetails: { // 新增设备详细信息
            model: "EM-S100",
            ipAddress: "192.168.1.101",
            macAddress: "00:1A:2B:3C:4D:5E",
            firmwareVersion: "v1.2.3",
            // 可以根据需要添加更多字段
          }
        },
        {
          id: "REQ002",
          deviceName: "高清安防摄像头",
          sourcePlatform: "Beta视频监控中心",
          protocol: "HTTP",
          requestTime: new Date("2024-07-20T15:30:00"),
          status: "approved",
          processedTime: new Date("2024-07-20T16:00:00"),
          deviceDetails: { // 新增设备详细信息
            model: "CAM-HD2000",
            ipAddress: "192.168.1.102",
            macAddress: "00:1A:2B:3C:4D:5F",
            firmwareVersion: "v2.0.1",
            // 可以根据需要添加更多字段
          }
        },
      ];
      this.isLoading = false;
    },
    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    getStatusText(status) {
      const map = {
        pending: "待处理",
        approved: "已同意",
        rejected: "已拒绝",
      };
      return map[status] || "未知";
    },
    getStatusTagClass(status) {
      if (status === "pending") return "status-pending";
      if (status === "approved") return "status-approved";
      if (status === "rejected") return "status-rejected";
      return "";
    },
    getCardStatusClass(status) {
      if (status === "approved") return "card-approved";
      if (status === "rejected") return "card-rejected";
      return "card-pending";
    },
    async updateRequestStatus(requestId, newStatus) {
      this.isLoading = true;
      console.log(`调用后端API: 更新请求 ${requestId} 状态为 ${newStatus}`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const request = this.connectionRequests.find(
        (req) => req.id === requestId
      );

      if (request) {
        request.status = newStatus;
        request.processedTime = new Date();

        if (newStatus === 'approved') {
          const newDevice = {
            id: `DEV-CONN-${request.id.slice(-3)}${Date.now().toString().slice(-3)}`,
            name: request.deviceName,
            type: request.protocol === 'MQTT' ? '物联网设备' : '网络设备',
            status: 'offline',
            lastSeen: null,
            location: `来自 ${request.sourcePlatform}`,
            longitude: null, // 初始可以没有经纬度
            latitude: null,
            firmware: request.deviceDetails?.firmwareVersion || 'v1.0.0', // 从deviceDetails获取
            // 从 deviceDetails 中提取更多信息
            model: request.deviceDetails?.model || '未知型号',
            ipAddress: request.deviceDetails?.ipAddress || '未知IP',
            macAddress: request.deviceDetails?.macAddress || '未知MAC',
            // ... 其他您希望传递的属性
          };

          try {
            const localDevicesRaw = localStorage.getItem('devices');
            let devices = localDevicesRaw ? JSON.parse(localDevicesRaw) : [];
            if (!devices.some(d => d.id === newDevice.id || d.name === newDevice.name)) {
              devices.push(newDevice);
              localStorage.setItem('devices', JSON.stringify(devices));
              console.log(`设备 ${newDevice.name} 已添加到 localStorage，包含详细信息`);
            } else {
              console.log(`设备 ${newDevice.name} 已存在于 localStorage，不再重复添加`);
            }
          } catch (error) {
            console.error("更新localStorage中的设备列表失败:", error);
          }
        }
      }
      this.isLoading = false;
    },

    approveRequest(requestId) {
      this.updateRequestStatus(requestId, "approved");
    },
    rejectRequest(requestId) {
      this.updateRequestStatus(requestId, "rejected");
    },
  },
  mounted() {
    this.fetchConnectionRequests(); // 组件挂载后获取数据
  },
};
</script>

<style lang="scss">
@use "@/assets/navHeaderStyles.scss"; // Or @import, if @use is not configured
</style>
