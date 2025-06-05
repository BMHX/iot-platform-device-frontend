<template>
  <div class="connect-page">
    <el-card class="search-form">
      <el-row :gutter="20">
        <el-col :span="16">
          <h2>设备对接管理</h2>
        </el-col>
        <el-col :span="8" class="text-right">
          <el-button type="primary" @click="openCreateRequestModal">
            <el-icon><Plus /></el-icon> 创建对接请求
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="filter-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <div>
            <span class="filter-label">状态：</span>
            <el-radio-group v-model="selectedStatusFilter" size="large" @change="filterRequests">
              <el-radio-button value="all">全部请求</el-radio-button>
              <el-radio-button value="0">未集成</el-radio-button>
              <el-radio-button value="1">已集成</el-radio-button>
              <el-radio-button value="3">已拒绝</el-radio-button>
            </el-radio-group>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card v-loading="isLoading">
      <div v-if="filteredDevices.length === 0" class="no-requests">
        <el-empty description="暂无设备" />
      </div>

      <div class="requests-grid">
        <el-card
          v-for="device in paginatedDevices"
          :key="device.id"
          class="request-card"
          :class="getCardStatusClass(device.deviceIntegration)"
          shadow="hover"
        >
          <div class="card-header">
            <div class="protocol-icon">[{{ device.deviceType || '未知' }}]</div>
            <h3 class="device-name">{{ device.deviceName }}</h3>
            <el-tag
              class="request-status-tag"
              :type="getStatusTagType(device.deviceIntegration)"
            >{{ getStatusText(device.deviceIntegration) }}</el-tag>
          </div>
          <div class="card-body">
            <p><strong>设备ID:</strong> {{ device.id }}</p>
            <p><strong>设备编码:</strong> {{ device.deviceCode }}</p>
            <p><strong>创建时间:</strong> {{ formatDate(device.createdAt) }}</p>
            <p><strong>更新时间:</strong> {{ formatDate(device.updatedAt) }}</p>
            <el-collapse>
              <el-collapse-item title="设备详细信息">
                <p><strong>设备类型:</strong> {{ device.deviceType || '未知' }}</p>
                <p><strong>在线状态:</strong> 
                  <el-tag :type="device.status === 1 ? 'success' : 'info'">
                    {{ device.status === 1 ? '在线' : '离线' }}
                  </el-tag>
                </p>
                <p v-if="device.latitude && device.longitude">
                  <strong>位置:</strong> 经度: {{ device.longitude }}, 纬度: {{ device.latitude }}
                </p>
              </el-collapse-item>
            </el-collapse>
          </div>
          <div class="card-footer" v-if="device.deviceIntegration === 0">
            <el-button
              @click="approveDevice(device)"
              type="primary"
              size="small"
            >
              同意对接
            </el-button>
            <el-button
              @click="rejectDevice(device.id)"
              type="danger"
              size="small"
            >
              拒绝请求
            </el-button>
          </div>
          <div class="card-footer processed-footer" v-else>
            <p>处理时间: {{ formatDate(device.updatedAt) }}</p>
            <el-button 
              v-if="device.deviceIntegration === 1" 
              type="success" 
              size="small"
              @click="viewDeviceDetails(device)"
            >
              查看设备
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 添加分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[8, 16, 24, 32]"
          :total="filteredDevices.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建对接请求弹窗 -->
    <el-dialog
      v-model="showCreateRequestModal"
      title="创建设备对接请求"
      width="600px"
      @close="closeCreateRequestModal"
    >
      <el-form :model="deviceForm" label-width="120px" label-position="right">
        <el-form-item label="设备名称" required>
          <el-input v-model="deviceForm.deviceName" />
        </el-form-item>
        <el-form-item label="设备编码" required>
          <el-input v-model="deviceForm.deviceCode" />
        </el-form-item>
        <el-form-item label="设备类型" required>
          <el-select v-model="deviceForm.deviceType" style="width: 100%">
            <el-option label="MQTT" value="MQTT" />
            <el-option label="HTTP" value="HTTP" />
            <el-option label="CoAP" value="CoAP" />
            <el-option label="Modbus" value="Modbus" />
          </el-select>
        </el-form-item>
        <el-form-item label="经度">
          <el-input v-model="deviceForm.longitude" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input v-model="deviceForm.latitude" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeCreateRequestModal">取消</el-button>
          <el-button type="primary" @click="submitCreateDevice">提交请求</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 协议选择弹窗 -->
    <el-dialog
      v-model="showProtocolSelectModal"
      title="选择设备协议"
      width="600px"
      @close="closeProtocolSelectModal"
    >
      <div v-loading="loadingProtocols">
        <el-table
          v-if="protocols.length > 0"
          :data="protocols"
          style="width: 100%"
          border
          @row-click="selectProtocol"
          highlight-current-row
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="protocolName" label="协议名称" width="150" />
          <el-table-column prop="protocolCode" label="协议编码" width="150" />
          <el-table-column prop="version" label="版本" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                {{ scope.row.status === 1 ? "启用" : "禁用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" />
        </el-table>
        <el-empty v-else description="暂无可用协议" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeProtocolSelectModal">取消</el-button>
          <el-button type="primary" @click="confirmProtocolSelect" :disabled="!selectedProtocol">确认选择</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from "element-plus";
import { Plus } from '@element-plus/icons-vue';
import { listDevicesByAdminId, addDevice, updateDeviceIntegration } from "@/api/device";
import { getProtocolList } from "@/api/protocol";
import { addDeviceProtocol } from "@/api/deviceProtocol";

export default {
  name: "ConnectPage",
  components: {
    Plus
  },
  data() {
    return {
      isLoading: false,
      selectedStatusFilter: "all",
      devices: [],
      showCreateRequestModal: false,
      showProtocolSelectModal: false,
      deviceForm: {
        deviceName: '',
        deviceCode: '',
        deviceType: 'MQTT',
        latitude: '',
        longitude: '',
        status: 1,
        deviceIntegration: 0, // 默认未集成
      },
      currentDevice: null,
      protocols: [],
      selectedProtocol: null,
      loadingProtocols: false,
      adminId: 1, // 固定使用管理员ID为1
      // 添加分页相关数据
      currentPage: 1,
      pageSize: 8
    };
  },
  computed: {
    filteredDevices() {
      if (this.selectedStatusFilter === "all") {
        return this.devices.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
      const integrationStatus = parseInt(this.selectedStatusFilter);
      return this.devices
        .filter((device) => device.deviceIntegration === integrationStatus)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    // 添加分页计算属性
    paginatedDevices() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredDevices.slice(start, end);
    }
  },
  methods: {
    async fetchDevices() {
      this.isLoading = true;
      
      try {
        const result = await listDevicesByAdminId(this.adminId);
        
        if (Array.isArray(result)) {
          this.devices = result;
        } else if (result && result.data && Array.isArray(result.data)) {
          this.devices = result.data;
        } else {
          this.devices = [];
          ElMessage.warning('获取设备列表失败，格式不符合预期');
        }
      } catch (error) {
        console.error('获取设备列表失败:', error);
        ElMessage.error('获取设备列表失败');
        this.devices = [];
      } finally {
        this.isLoading = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    
    getStatusText(integrationStatus) {
      if (integrationStatus === 1) return '已集成';
      if (integrationStatus === 0) return '未集成';
      if (integrationStatus === 3) return '已拒绝';
      return '未知状态';
    },
    
    getStatusTagType(integrationStatus) {
      if (integrationStatus === 1) return "success";
      if (integrationStatus === 0) return "warning";
      if (integrationStatus === 3) return "danger";
      return "info";
    },
    
    getCardStatusClass(integrationStatus) {
      if (integrationStatus === 1) return "card-approved";
      if (integrationStatus === 3) return "card-rejected";
      return "card-pending";
    },
    
    filterRequests() {
      this.currentPage = 1; // 重置到第一页
    },
    
    openCreateRequestModal() {
      this.deviceForm = {
        deviceName: '',
        deviceCode: '',
        deviceType: 'MQTT',
        latitude: '',
        longitude: '',
        status: 1,
        deviceIntegration: 0, // 默认未集成
      };
      this.showCreateRequestModal = true;
    },
    
    closeCreateRequestModal() {
      this.showCreateRequestModal = false;
    },
    
    async submitCreateDevice() {
      // 表单验证
      if (!this.deviceForm.deviceName) {
        ElMessage.warning('请输入设备名称');
        return;
      }
      if (!this.deviceForm.deviceCode) {
        ElMessage.warning('请输入设备编码');
        return;
      }
      
      this.isLoading = true;
      try {
        // 准备提交到后端的数据
        const deviceData = {
          ...this.deviceForm,
          adminId: this.adminId,
        };
        
        // 调用添加设备API
        const result = await addDevice(deviceData);
        
        ElMessage.success('设备对接请求已创建');
        this.closeCreateRequestModal();
        
        // 刷新设备列表
        this.fetchDevices();
      } catch (error) {
        console.error('创建设备失败:', error);
        ElMessage.error('创建设备失败: ' + (error.message || '未知错误'));
      } finally {
        this.isLoading = false;
      }
    },
    
    async approveDevice(device) {
      this.currentDevice = device;
      
      // 加载协议列表
      await this.loadProtocols();
      
      // 打开协议选择弹窗
      this.showProtocolSelectModal = true;
    },
    
    async loadProtocols() {
      this.loadingProtocols = true;
      this.protocols = [];
      
      try {
        const result = await getProtocolList();
        
        if (Array.isArray(result)) {
          this.protocols = result;
        } else if (result && result.data && Array.isArray(result.data)) {
          this.protocols = result.data;
        } else {
          ElMessage.warning('获取协议列表失败，格式不符合预期');
        }
      } catch (error) {
        console.error('加载协议列表失败:', error);
        ElMessage.error('加载协议列表失败');
      } finally {
        this.loadingProtocols = false;
      }
    },
    
    selectProtocol(row) {
      this.selectedProtocol = row;
    },
    
    closeProtocolSelectModal() {
      this.showProtocolSelectModal = false;
      this.selectedProtocol = null;
    },
    
    async confirmProtocolSelect() {
      if (!this.selectedProtocol || !this.currentDevice) {
        ElMessage.warning('请选择协议');
        return;
      }
      
      this.isLoading = true;
      
      try {
        // 创建设备协议绑定
        await addDeviceProtocol({
          deviceId: this.currentDevice.id,
          protocolId: this.selectedProtocol.id,
          bindTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });
        
        // 更新设备集成状态为已集成(1)
        await updateDeviceIntegration(this.currentDevice.id, 1);
        
        ElMessage.success('设备对接成功');
        
        // 刷新设备列表
        this.fetchDevices();
      } catch (error) {
        console.error('设备对接失败:', error);
        ElMessage.error('设备对接失败: ' + (error.message || '未知错误'));
      } finally {
        this.isLoading = false;
        this.closeProtocolSelectModal();
      }
    },
    
    async rejectDevice(deviceId) {
      this.isLoading = true;
      
      try {
        // 更新设备集成状态为已拒绝(3)
        await updateDeviceIntegration(deviceId, 3);
        
        ElMessage.success('已拒绝设备对接请求');
        
        // 刷新设备列表
        this.fetchDevices();
      } catch (error) {
        console.error('拒绝设备对接失败:', error);
        ElMessage.error('拒绝设备对接失败: ' + (error.message || '未知错误'));
      } finally {
        this.isLoading = false;
      }
    },
    
    viewDeviceDetails(device) {
      if (device.id) {
        // 跳转到设备详情页
        this.$router.push(`/device?id=${device.id}`);
      } else {
        ElMessage.warning('无法获取设备信息');
      }
    },
    
    // 添加分页方法
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1; // 重置到第一页
    },
    
    handleCurrentChange(val) {
      this.currentPage = val;
    }
  },
  mounted() {
    this.fetchDevices();
  }
};
</script>

<style lang="scss" scoped>
.connect-page {
  padding: 20px;
}

.search-form, .filter-card {
  margin-bottom: 20px;
}

.text-right {
  text-align: right;
}

.filter-label {
  margin-right: 10px;
}

.no-requests {
  padding: 40px 0;
  text-align: center;
}

.requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.request-card {
  border-radius: 8px;
  transition: all 0.3s;
  
  &.card-pending {
    border-left: 4px solid #e6a23c;
  }
  
  &.card-approved {
    border-left: 4px solid #67c23a;
  }
  
  &.card-rejected {
    border-left: 4px solid #f56c6c;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    
    .protocol-icon {
      background-color: #f0f2f5;
      padding: 4px 8px;
      border-radius: 4px;
      margin-right: 10px;
      font-size: 12px;
    }
    
    .device-name {
      flex: 1;
      margin: 0;
      font-size: 16px;
    }
    
    .request-status-tag {
      margin-left: 10px;
    }
  }
  
  .card-body {
    margin-bottom: 15px;
    
    p {
      margin: 5px 0;
      font-size: 14px;
    }
  }
  
  .card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    
    &.processed-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      p {
        margin: 0;
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
