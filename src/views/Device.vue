<template>
  <div class="device-page device-page-styles">
    <!-- Add device-page-styles class here -->
    <div class="actions-header">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索设备名称或ID..."
        class="search-input"
      />
      <button @click="openAddDeviceModal" class="btn btn-primary">
        添加设备
      </button>
    </div>

    <div class="status-tabs">
      <button
        class="tab-btn"
        :class="{ active: currentStatusFilter === 'all' }"
        @click="currentStatusFilter = 'all'"
      >
        全部
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentStatusFilter === 'online' }"
        @click="currentStatusFilter = 'online'"
      >
        在线
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentStatusFilter === 'offline' }"
        @click="currentStatusFilter = 'offline'"
      >
        离线
      </button>
    </div>

    <div v-if="isLoading" class="loading-spinner">正在加载...</div>

    <table v-if="!isLoading && filteredDevices.length > 0">
      <thead>
        <tr>
          <th>ID</th>
          <th>设备名称</th>
          <th>类型</th>
          <th>状态</th>
          <th>位置描述</th>
          <th>城市</th>
          <th>最后上线时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <!-- 修改这里：将 processedDevices 修改为 filteredDevices -->
        <tr v-for="device in filteredDevices" :key="device.id">
          <td>{{ device.id }}</td>
          <td>{{ device.name }}</td>
          <td>{{ device.type }}</td>
          <td>
            <span
              :class="[
                'status-badge',
                device.status === 'online' ? 'status-online' : 'status-offline',
              ]"
            >
              {{ device.status === "online" ? "在线" : "离线" }}
            </span>
          </td>
          <td>{{ device.location || "-" }}</td>
          <td>{{ device.cityName || "解析中..." }}</td>
          <td>
            {{
              device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "-"
            }}
          </td>
          <td>
            <button
              @click="openEditDeviceModal(device)"
              class="btn btn-sm btn-warning"
            >
              编辑
            </button>
            <button
              @click="deleteDevice(device.id)"
              class="btn btn-sm btn-danger"
            >
              删除
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="!isLoading && filteredDevices.length === 0" class="no-data">
      暂无设备数据。
    </div>

    <!-- 设备表单弹窗 -->
    <DeviceFormModal
      :visible="showDeviceFormModal"
      :editingDeviceData="editingDevice"
      @save="handleSaveDevice"
      @close="closeDeviceFormModal"
    />
  </div>
</template>

<script>
// import DeviceFormModal from '@/components/DeviceFormModal.vue'; // 稍后取消注释
import DeviceFormModal from "@/components/DeviceFormModal.vue";

export default {
  components: { DeviceFormModal },
  data() {
    return {
      isLoading: false,
      searchQuery: "",
      currentStatusFilter: "all", // 'all', 'online', 'offline'
      devices: [], // 将从后端获取或localStorage
      showDeviceFormModal: false,
      editingDevice: null,
      processedDevices: [], // 用于存储包含解析后城市名称的设备列表
    };
  },
  computed: {
    filteredDevices() {
      // 这个计算属性现在作用于 processedDevices
      let devices = this.processedDevices;
      if (this.currentStatusFilter !== "all") {
        devices = devices.filter((d) => d.status === this.currentStatusFilter);
      }
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        devices = devices.filter(
          (d) =>
            d.name.toLowerCase().includes(query) ||
            d.id.toLowerCase().includes(query)
        );
      }
      return devices;
    },
  },
  watch: {
    // 新增 watch 侦听器
    devices: {
      handler(newDevices) {
        if (newDevices && newDevices.length > 0) {
          this.updateProcessedDevices(newDevices);
        } else {
          this.processedDevices = []; // 如果 devices 为空，则清空 processedDevices
        }
      },
      deep: true, // 深度侦听，以便数组内部对象变化也能触发
      // immediate: true // 如果需要在组件创建时立即执行一次，可以取消注释，但 fetchDevices 也会调用
    },
  },
  methods: {
    async fetchDevices() {
      this.isLoading = true;
      console.log("尝试从localStorage获取设备列表或调用后端API");
      // 移除不必要的 await new Promise，让加载更快
      // await new Promise((resolve) => setTimeout(resolve, 500));

      const localDevices = localStorage.getItem("devices");
      let loadedDevices = [];
      if (localDevices) {
        try {
          loadedDevices = JSON.parse(localDevices);
          console.log("从localStorage加载设备列表:", loadedDevices);
        } catch (error) {
          console.error("解析localStorage中的设备数据失败:", error);
          // 解析失败时，也尝试加载回退数据
          loadedDevices = this.loadFallbackDevicesData();
        }
      } else {
        loadedDevices = this.loadFallbackDevicesData();
      }
      this.devices = loadedDevices;
      // 显式调用 updateProcessedDevices，而不是仅仅依赖 watch
      // 因为 watch 可能在 this.devices 赋值后，isLoading 变为 false 之前还未完成处理
      // 但是，由于我们添加了 watch，这里可以考虑是否移除，或者让 watch 的 immediate: true 处理首次加载
      // 为了确保数据能尽快处理，保留这里的调用，watch 主要处理后续变化
      if (this.devices.length > 0) {
        await this.updateProcessedDevices(this.devices); // 等待处理完成
      } else {
        this.processedDevices = []; // 如果没有设备，直接清空
      }

      this.isLoading = false;
    },
    loadFallbackDevicesData() {
      // 修改为返回数据，而不是直接赋值
      console.log("加载默认模拟设备数据");
      return [
        {
          id: "DEV001",
          name: "智能温度计",
          type: "传感器",
          status: "online",
          lastSeen: "2024-05-22T10:00:00Z",
          location: "仓库A",
          longitude: 116.407395, // 北京市经度
          latitude: 39.904211, // 北京市纬度
          firmware: "v1.2.3",
        },
        {
          id: "DEV002",
          name: "高清摄像头",
          type: "监控设备",
          status: "offline",
          lastSeen: "2024-05-21T15:30:00Z",
          location: "大门入口",
          longitude: 121.473701, // 上海市经度
          latitude: 31.230416, // 上海市纬度
          firmware: "v2.0.1",
        },
        {
          id: "DEV003",
          name: "环境监测仪",
          type: "传感器",
          status: "online",
          lastSeen: "2024-05-22T11:20:00Z",
          location: "实验室",
          longitude: 113.943634, // 例如，深圳的经度
          latitude: 22.548979, // 例如，深圳的纬度
          firmware: "v1.5.0",
        },
        {
          id: "DEV004",
          name: "智能门锁",
          type: "安防设备",
          status: "online",
          lastSeen: "2024-05-22T12:00:00Z",
          location: "办公室",
          longitude: 113.264385, // 广州市经度
          latitude: 23.12911, // 广州市纬度
          firmware: "v3.1.0",
        },
      ];
    },
    loadFallbackDevices() {
      // 保留原方法名，但内部调用新的返回数据的方法
      this.devices = this.loadFallbackDevicesData();
    },
    // 模拟逆地理编码API调用
    async reverseGeocode(latitude, longitude) {
      if (
        latitude === null ||
        longitude === null ||
        latitude === undefined ||
        longitude === undefined
      ) {
        return "无坐标";
      }
      console.log(`模拟逆地理编码: ${latitude}, ${longitude}`);
      // 模拟网络延迟
      await new Promise((resolve) =>
        setTimeout(resolve, 300 + Math.random() * 500)
      );

      // 简化的模拟逻辑：根据经纬度范围大致判断城市
      // 实际应用中，这里会是 fetch 调用第三方API
      if (
        latitude > 39.4 &&
        latitude < 41.1 &&
        longitude > 115.4 &&
        longitude < 117.5
      ) {
        return "北京市 (模拟)";
      } else if (
        latitude > 30.4 &&
        latitude < 31.9 &&
        longitude > 120.8 &&
        longitude < 122.2
      ) {
        return "上海市 (模拟)";
      } else if (
        latitude > 22.5 &&
        latitude < 23.9 &&
        longitude > 112.7 &&
        longitude < 114.1
      ) {
        return "广州市 (模拟)";
      } else if (
        latitude > 22.1 &&
        latitude < 22.6 &&
        longitude > 113.3 &&
        longitude < 114.7
      ) {
        return "深圳市 (模拟)";
      }
      return "未知区域 (模拟)";
    },

    async updateProcessedDevices(devicesToProcess) {
      // 参数名修改以避免与 this.devices 混淆
      // 只有在真正开始处理时才设置 isLoading 为 true
      // 如果 devicesToProcess 为空或未定义，则不进行处理
      if (!devicesToProcess || devicesToProcess.length === 0) {
        this.processedDevices = [];
        this.isLoading = false; // 确保在没有数据处理时也关闭加载状态
        return;
      }
      this.isLoading = true;
      const newProcessedDevices = [];
      for (const device of devicesToProcess) {
        const cityName = await this.reverseGeocode(
          device.latitude,
          device.longitude
        );
        newProcessedDevices.push({ ...device, cityName });
      }
      this.processedDevices = newProcessedDevices;
      this.isLoading = false;
    },

    openAddDeviceModal() {
      this.editingDevice = null;
      this.showDeviceFormModal = true;
      console.log("打开新增设备弹窗");
      // 实际操作： this.showDeviceFormModal = true;
    },
    openEditDeviceModal(device) {
      this.editingDevice = { ...device }; // 传递副本以避免直接修改原数据
      this.showDeviceFormModal = true;
      console.log("打开编辑设备弹窗:", device);
      // 实际操作： this.showDeviceFormModal = true;
    },
    async handleSaveDevice(deviceData) {
      this.isLoading = true;
      console.log("调用后端API: 保存设备", deviceData);
      await new Promise((resolve) => setTimeout(resolve, 500));

      let updatedDevices = [...this.devices]; // 创建副本进行操作
      if (deviceData.id) {
        const index = updatedDevices.findIndex((d) => d.id === deviceData.id);
        if (index !== -1) {
          updatedDevices.splice(index, 1, { ...deviceData });
        }
      } else {
        const newDeviceWithId = {
          ...deviceData,
          id: `DEV${Date.now().toString().slice(-4)}${Math.random()
            .toString(36)
            .substr(2, 2)
            .toUpperCase()}`,
          lastSeen: new Date().toISOString(),
        };
        updatedDevices.push(newDeviceWithId);
      }

      this.devices = updatedDevices; // 触发 watch 更新 processedDevices

      try {
        localStorage.setItem("devices", JSON.stringify(this.devices));
        console.log("设备列表已更新到localStorage", this.devices);
      } catch (error) {
        console.error("保存设备列表到localStorage失败:", error);
      }

      // isLoading 会在 updateProcessedDevices 中处理，或者在这里显式设置为 false
      // this.isLoading = false; // 如果 watch 更新很快，可能不需要在这里设置
      this.closeDeviceFormModal();
    },

    async deleteDevice(deviceId) {
      if (!confirm("确定要删除此设备吗？")) return;
      // this.isLoading = true; // isLoading 的管理移到 updateProcessedDevices 或由 watch 触发
      console.log(`调用后端API: 删除设备 ${deviceId}`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.devices = this.devices.filter((d) => d.id !== deviceId); // 触发 watch

      try {
        localStorage.setItem("devices", JSON.stringify(this.devices));
        console.log(
          `设备 ${deviceId} 已从localStorage删除，剩余设备:`,
          this.devices
        );
      } catch (error) {
        console.error("保存设备列表到localStorage失败:", error);
      }
      // this.isLoading = false; // isLoading 的管理移到 updateProcessedDevices 或由 watch 触发
    },
    viewDeviceDetails(deviceId) {
      console.log("查看设备详情:", deviceId);
      // 实际操作：可能路由到设备详情页 this.$router.push(`/devices/${deviceId}`);
      // 或者打开一个详情模态框
    },
  },
  mounted() {
    this.fetchDevices();
  },
};
</script>

<style lang="scss">
@use "@/assets/navHeaderStyles.scss"; // Or @import, if @use is not configured
</style>
