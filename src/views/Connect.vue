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
              <el-radio-button value="pending">待处理</el-radio-button>
              <el-radio-button value="approved">已同意</el-radio-button>
              <el-radio-button value="rejected">已拒绝</el-radio-button>
            </el-radio-group>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card v-loading="isLoading">
      <div v-if="filteredRequests.length === 0" class="no-requests">
        <el-empty description="暂无对接请求" />
      </div>

      <div class="requests-grid">
        <el-card
          v-for="request in filteredRequests"
          :key="request.id"
          class="request-card"
          :class="getCardStatusClass(request.status)"
          shadow="hover"
        >
          <div class="card-header">
            <div class="protocol-icon">[{{ request.protocol }}]</div>
            <h3 class="device-name">{{ request.deviceName }}</h3>
            <el-tag
              class="request-status-tag"
              :type="getStatusTagType(request.status)"
            >{{ getStatusText(request.status) }}</el-tag>
          </div>
          <div class="card-body">
            <p><strong>请求ID:</strong> {{ request.id }}</p>
            <p><strong>来源平台:</strong> {{ request.sourcePlatform }}</p>
            <p><strong>请求时间:</strong> {{ formatDate(request.requestTime) }}</p>
            <p v-if="request.processedTime">
              <strong>处理时间:</strong> {{ formatDate(request.processedTime) }}
            </p>
            <el-collapse v-if="request.deviceDetails">
              <el-collapse-item title="设备详细信息">
                <p><strong>型号:</strong> {{ request.deviceDetails.model || '未知' }}</p>
                <p><strong>IP地址:</strong> {{ request.deviceDetails.ipAddress || '未知' }}</p>
                <p><strong>MAC地址:</strong> {{ request.deviceDetails.macAddress || '未知' }}</p>
                <p><strong>固件版本:</strong> {{ request.deviceDetails.firmwareVersion || '未知' }}</p>
              </el-collapse-item>
            </el-collapse>
          </div>
          <div class="card-footer" v-if="request.status === 'pending'">
            <el-button
              @click="approveRequest(request)"
              type="primary"
              size="small"
            >
              同意对接
            </el-button>
            <el-button
              @click="rejectRequest(request.id)"
              type="danger"
              size="small"
            >
              拒绝请求
            </el-button>
          </div>
          <div class="card-footer processed-footer" v-else>
            <p>请求已于 {{ formatDate(request.processedTime) }} 处理</p>
            <el-button 
              v-if="request.status === 'approved'" 
              type="success" 
              size="small"
              @click="viewDeviceDetails(request)"
            >
              查看设备
            </el-button>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 创建对接请求弹窗 -->
    <el-dialog
      v-model="showCreateRequestModal"
      title="创建设备对接请求"
      width="600px"
      @close="closeCreateRequestModal"
    >
      <el-form :model="requestForm" label-width="120px" label-position="right">
        <el-form-item label="设备名称" required>
          <el-input v-model="requestForm.deviceName" />
        </el-form-item>
        <el-form-item label="来源平台" required>
          <el-input v-model="requestForm.sourcePlatform" />
        </el-form-item>
        <el-form-item label="协议类型" required>
          <el-select v-model="requestForm.protocol" style="width: 100%">
            <el-option label="MQTT" value="MQTT" />
            <el-option label="HTTP" value="HTTP" />
            <el-option label="CoAP" value="CoAP" />
            <el-option label="Modbus" value="Modbus" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="requestForm.deviceDetails.model" />
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input v-model="requestForm.deviceDetails.ipAddress" />
        </el-form-item>
        <el-form-item label="MAC地址">
          <el-input v-model="requestForm.deviceDetails.macAddress" />
        </el-form-item>
        <el-form-item label="固件版本">
          <el-input v-model="requestForm.deviceDetails.firmwareVersion" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeCreateRequestModal">取消</el-button>
          <el-button type="primary" @click="submitCreateRequest">提交请求</el-button>
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
import { addDevice } from "@/api/device";
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
      connectionRequests: [],
      showCreateRequestModal: false,
      showProtocolSelectModal: false,
      requestForm: {
        deviceName: '',
        sourcePlatform: '',
        protocol: 'MQTT',
        deviceDetails: {
          model: '',
          ipAddress: '',
          macAddress: '',
          firmwareVersion: ''
        }
      },
      currentRequest: null,
      protocols: [],
      selectedProtocol: null,
      loadingProtocols: false,
      adminId: 1 // 固定使用管理员ID为1
    };
  },
  computed: {
    filteredRequests() {
      if (this.selectedStatusFilter === "all") {
        return this.connectionRequests.sort(
          (a, b) => new Date(b.requestTime) - new Date(a.requestTime)
        );
      }
      return this.connectionRequests
        .filter((req) => req.status === this.selectedStatusFilter)
        .sort((a, b) => new Date(b.requestTime) - new Date(a.requestTime));
    },
  },
  methods: {
    async fetchConnectionRequests() {
      this.isLoading = true;
      
      try {
        // 这里应该调用后端API获取设备对接请求列表
        // 由于没有真实的后端API，我们使用模拟数据
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // 从localStorage中获取已保存的请求
        const savedRequests = localStorage.getItem('connectionRequests');
        if (savedRequests) {
          this.connectionRequests = JSON.parse(savedRequests);
        } else {
          // 初始化一些示例数据
          this.connectionRequests = [
            {
              id: "REQ001",
              deviceName: "智能环境监测仪",
              sourcePlatform: "Alpha环境监测云",
              protocol: "MQTT",
              requestTime: new Date().toISOString(),
              status: "pending",
              processedTime: null,
              deviceDetails: {
                model: "EM-S100",
                ipAddress: "192.168.1.101",
                macAddress: "00:1A:2B:3C:4D:5E",
                firmwareVersion: "v1.2.3"
              }
            },
            {
              id: "REQ002",
              deviceName: "高清安防摄像头",
              sourcePlatform: "Beta视频监控中心",
              protocol: "HTTP",
              requestTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              status: "approved",
              processedTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
              deviceDetails: {
                model: "CAM-HD2000",
                ipAddress: "192.168.1.102",
                macAddress: "00:1A:2B:3C:4D:5F",
                firmwareVersion: "v2.0.1"
              },
              deviceId: 1 // 关联的设备ID
            }
          ];
          
          // 保存到localStorage
          localStorage.setItem('connectionRequests', JSON.stringify(this.connectionRequests));
        }
      } catch (error) {
        console.error('获取设备对接请求失败:', error);
        ElMessage.error('获取设备对接请求失败');
      } finally {
        this.isLoading = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    
    getStatusText(status) {
      const map = {
        pending: "待处理",
        approved: "已同意",
        rejected: "已拒绝"
      };
      return map[status] || "未知";
    },
    
    getStatusTagType(status) {
      if (status === "pending") return "warning";
      if (status === "approved") return "success";
      if (status === "rejected") return "danger";
      return "info";
    },
    
    getCardStatusClass(status) {
      if (status === "approved") return "card-approved";
      if (status === "rejected") return "card-rejected";
      return "card-pending";
    },
    
    filterRequests() {
      // 过滤请求，这里不需要额外操作，因为使用了计算属性
    },
    
    openCreateRequestModal() {
      this.requestForm = {
        deviceName: '',
        sourcePlatform: '',
        protocol: 'MQTT',
        deviceDetails: {
          model: '',
          ipAddress: '',
          macAddress: '',
          firmwareVersion: ''
        }
      };
      this.showCreateRequestModal = true;
    },
    
    closeCreateRequestModal() {
      this.showCreateRequestModal = false;
    },
    
    submitCreateRequest() {
      // 表单验证
      if (!this.requestForm.deviceName) {
        ElMessage.warning('请输入设备名称');
        return;
      }
      if (!this.requestForm.sourcePlatform) {
        ElMessage.warning('请输入来源平台');
        return;
      }
      
      // 创建新的对接请求
      const newRequest = {
        id: `REQ${Date.now().toString().slice(-6)}`,
        deviceName: this.requestForm.deviceName,
        sourcePlatform: this.requestForm.sourcePlatform,
        protocol: this.requestForm.protocol,
        requestTime: new Date().toISOString(),
        status: "pending",
        processedTime: null,
        deviceDetails: { ...this.requestForm.deviceDetails }
      };
      
      // 添加到请求列表
      this.connectionRequests.unshift(newRequest);
      
      // 保存到localStorage
      localStorage.setItem('connectionRequests', JSON.stringify(this.connectionRequests));
      
      ElMessage.success('对接请求已创建');
      this.closeCreateRequestModal();
    },
    
    async approveRequest(request) {
      this.currentRequest = request;
      
      // 加载协议列表
      await this.loadProtocols();
      
      // 打开协议选择弹窗
      this.showProtocolSelectModal = true;
    },
    
    async loadProtocols() {
      this.loadingProtocols = true;
      this.protocols = [];
      
      try {
        const result = await getProtocolList({});
        
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
      if (!this.selectedProtocol || !this.currentRequest) {
        ElMessage.warning('请选择协议');
        return;
      }
      
      this.isLoading = true;
      
      try {
        // 创建设备
        const deviceData = {
          deviceName: this.currentRequest.deviceName,
          deviceCode: `${this.currentRequest.deviceDetails.model || 'DEV'}-${Date.now().toString().slice(-6)}`,
          deviceType: this.currentRequest.protocol,
          status: 1, // 在线
          adminId: this.adminId,
          latitude: '',
          longitude: '',
          deviceIntegration: 1, // 已集成
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // 调用添加设备API
        const result = await addDevice(deviceData);
        
        // 获取新设备的ID
        let deviceId;
        if (result && result.data) {
          deviceId = result.data;
        }
        
        if (deviceId) {
          // 创建设备协议绑定
          await addDeviceProtocol({
            deviceId: deviceId,
            protocolId: this.selectedProtocol.id
          });
          
          // 更新请求状态
          this.currentRequest.status = 'approved';
          this.currentRequest.processedTime = new Date().toISOString();
          this.currentRequest.deviceId = deviceId;
          
          // 保存到localStorage
          localStorage.setItem('connectionRequests', JSON.stringify(this.connectionRequests));
          
          ElMessage.success('设备对接成功');
        } else {
          throw new Error('无法获取设备ID');
        }
      } catch (error) {
        console.error('设备对接失败:', error);
        ElMessage.error('设备对接失败: ' + (error.message || '未知错误'));
      } finally {
        this.isLoading = false;
        this.closeProtocolSelectModal();
      }
    },
    
    rejectRequest(requestId) {
      // 找到对应的请求
      const request = this.connectionRequests.find(req => req.id === requestId);
      
      if (request) {
        // 更新请求状态
        request.status = 'rejected';
        request.processedTime = new Date().toISOString();
        
        // 保存到localStorage
        localStorage.setItem('connectionRequests', JSON.stringify(this.connectionRequests));
        
        ElMessage.success('已拒绝对接请求');
      }
    },
    
    viewDeviceDetails(request) {
      if (request.deviceId) {
        // 跳转到设备详情页
        this.$router.push(`/device?id=${request.deviceId}`);
      } else {
        ElMessage.warning('无法获取设备信息');
      }
    }
  },
  mounted() {
    this.fetchConnectionRequests();
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
</style>
