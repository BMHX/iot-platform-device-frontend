<template>
  <div class="page-container">
    <el-card class="search-form">
      <el-row :gutter="20">
        <el-col :span="16">
          <h2>设备协议绑定管理</h2>
        </el-col>
        <el-col :span="8" class="text-right">
          <el-button type="primary" @click="openAddBindingModal">
            <el-icon><Plus /></el-icon> 添加绑定关系
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="data-table">
      <div class="table-header">
        <div class="table-info">
          <el-tag type="info" v-if="bindingList.length > 0">
            共 {{ bindingList.length }} 条数据
          </el-tag>
          <el-tag type="info" v-else>暂无数据</el-tag>
        </div>
      </div>

      <el-table
        v-loading="isLoading"
        :data="bindingList"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="设备信息" min-width="200">
          <template #default="scope">
            <div v-if="scope.row.deviceInfo">
              <div><strong>设备名称:</strong> {{ scope.row.deviceInfo.deviceName }}</div>
              <div><strong>设备编码:</strong> {{ scope.row.deviceInfo.deviceCode }}</div>
              <div><strong>设备类型:</strong> {{ scope.row.deviceInfo.deviceType }}</div>
            </div>
            <div v-else>
              <el-tag type="info">设备ID: {{ scope.row.deviceId }}</el-tag>
              <el-button type="text" size="small" @click="loadDeviceInfo(scope.row)">
                加载设备信息
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="协议信息" min-width="200">
          <template #default="scope">
            <div v-if="scope.row.protocolInfo">
              <div><strong>协议名称:</strong> {{ scope.row.protocolInfo.protocolName }}</div>
              <div><strong>协议编码:</strong> {{ scope.row.protocolInfo.protocolCode }}</div>
              <div><strong>协议版本:</strong> {{ scope.row.protocolInfo.version }}</div>
            </div>
            <div v-else>
              <el-tag type="info">协议ID: {{ scope.row.protocolId }}</el-tag>
              <el-button type="text" size="small" @click="loadProtocolInfo(scope.row)">
                加载协议信息
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="绑定时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.bindTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="openEditBindingModal(scope.row)"
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除此绑定关系吗？"
              @confirm="handleDeleteBinding(scope.row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!isLoading && bindingList.length === 0" class="no-data">
        <el-empty description="暂无绑定数据" />
      </div>
    </el-card>

    <!-- 绑定表单弹窗 -->
    <el-dialog
      v-model="showBindingFormModal"
      :title="formTitle"
      width="600px"
      @close="closeBindingFormModal"
    >
      <el-form :model="formData" label-width="100px" label-position="right">
        <el-form-item label="设备" required>
          <el-select 
            v-model="formData.deviceId" 
            filterable 
            remote
            :remote-method="searchDevices"
            :loading="loadingDevices"
            placeholder="请选择设备"
            style="width: 100%"
          >
            <el-option 
              v-for="device in deviceOptions" 
              :key="device.id" 
              :label="device.deviceName" 
              :value="device.id"
            >
              <div>{{ device.deviceName }}</div>
              <small style="color: #999">{{ device.deviceCode }} | {{ device.deviceType }}</small>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="协议" required>
          <el-select 
            v-model="formData.protocolId" 
            filterable 
            remote
            :remote-method="searchProtocols"
            :loading="loadingProtocols"
            placeholder="请选择协议"
            style="width: 100%"
          >
            <el-option 
              v-for="protocol in protocolOptions" 
              :key="protocol.id" 
              :label="protocol.protocolName" 
              :value="protocol.id"
            >
              <div>{{ protocol.protocolName }}</div>
              <small style="color: #999">{{ protocol.protocolCode }} | {{ protocol.version }}</small>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="绑定时间">
          <el-date-picker
            v-model="formData.bindTime"
            type="datetime"
            placeholder="请选择绑定时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeBindingFormModal">取消</el-button>
          <el-button type="primary" @click="submitBindingForm">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ElMessage } from "element-plus";
import { Plus } from '@element-plus/icons-vue';
import { listAllDeviceProtocols, addDeviceProtocol, deleteByDeviceId } from "@/api/deviceProtocol";
import { listDevicesByAdminId, getById as getDeviceById } from "@/api/device";
import { getProtocolList, getProtocolById } from "@/api/protocol";

export default {
  components: { 
    Plus
  },
  data() {
    return {
      isLoading: false,
      bindingList: [],
      showBindingFormModal: false,
      formData: {
        id: null,
        deviceId: null,
        protocolId: null,
        bindTime: new Date().toISOString().slice(0, 19).replace('T', ' ') // 默认当前时间
      },
      deviceOptions: [],
      protocolOptions: [],
      loadingDevices: false,
      loadingProtocols: false,
      adminId: 1 // 固定使用管理员ID为1
    };
  },
  computed: {
    formTitle() {
      return this.formData.id ? '编辑绑定关系' : '添加绑定关系';
    }
  },
  methods: {
    formatDateTime(dateTime) {
      if (!dateTime) return '-';
      const date = new Date(dateTime);
      return date.toLocaleString();
    },
    
    async fetchBindings() {
      this.isLoading = true;
      
      try {
        const result = await listAllDeviceProtocols();
        console.log('获取到的绑定列表:', result);
        
        if (Array.isArray(result)) {
          // 直接是数组结构
          this.bindingList = result;
        } else if (result && result.data && Array.isArray(result.data)) {
          // 包含在data字段中
          this.bindingList = result.data;
        } else {
          // 其他格式，尝试处理
          this.bindingList = [];
          ElMessage.warning('绑定数据格式不符合预期');
        }
        
        // 加载设备和协议信息
        this.preloadBindingInfo();
        
        ElMessage.success('成功获取绑定列表');
      } catch (error) {
        console.error('获取绑定列表失败:', error);
        
        this.bindingList = [];
        
        let errorMsg = '获取绑定列表失败';
        if (error.response) {
          errorMsg += `: ${error.response.status}`;
          console.log('完整错误响应:', error.response);
        }
        
        ElMessage.error(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },

    // 预加载绑定关系中的设备和协议信息
    async preloadBindingInfo() {
      // 获取所有设备ID和协议ID
      const deviceIds = [...new Set(this.bindingList.map(item => item.deviceId))];
      const protocolIds = [...new Set(this.bindingList.map(item => item.protocolId))];
      
      try {
        // 获取设备信息
        const deviceResult = await listDevicesByAdminId(this.adminId);
        const devices = Array.isArray(deviceResult) ? deviceResult : 
                       (deviceResult && deviceResult.data ? deviceResult.data : []);
        
        // 获取协议信息
        const protocolResult = await getProtocolList();
        const protocols = Array.isArray(protocolResult) ? protocolResult : 
                         (protocolResult && protocolResult.data ? protocolResult.data : []);
        
        // 更新绑定列表中的设备和协议信息
        this.bindingList.forEach(binding => {
          // 设置设备信息
          const deviceInfo = devices.find(d => d.id === binding.deviceId);
          if (deviceInfo) {
            binding.deviceInfo = deviceInfo;
          }
          
          // 设置协议信息
          const protocolInfo = protocols.find(p => p.id === binding.protocolId);
          if (protocolInfo) {
            binding.protocolInfo = protocolInfo;
          }
        });
      } catch (error) {
        console.error('预加载绑定信息失败:', error);
      }
    },
    
    async loadDeviceInfo(binding) {
      if (!binding.deviceId) return;
      
      try {
        const device = await getDeviceById(binding.deviceId);
        if (device) {
          binding.deviceInfo = device;
        }
      } catch (error) {
        console.error(`加载设备信息失败, ID=${binding.deviceId}:`, error);
        ElMessage.error('加载设备信息失败');
      }
    },
    
    async loadProtocolInfo(binding) {
      if (!binding.protocolId) return;
      
      try {
        const protocol = await getProtocolById(binding.protocolId);
        if (protocol) {
          binding.protocolInfo = protocol;
        }
      } catch (error) {
        console.error(`加载协议信息失败, ID=${binding.protocolId}:`, error);
        ElMessage.error('加载协议信息失败');
      }
    },
    
    openAddBindingModal() {
      this.formData = {
        id: null,
        deviceId: null,
        protocolId: null,
        bindTime: new Date().toISOString().slice(0, 19).replace('T', ' ') // 默认当前时间
      };
      this.showBindingFormModal = true;
      
      // 加载设备和协议选项
      this.searchDevices('');
      this.searchProtocols('');
    },
    
    openEditBindingModal(binding) {
      this.formData = { 
        id: binding.id,
        deviceId: binding.deviceId,
        protocolId: binding.protocolId,
        bindTime: binding.bindTime || new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      this.showBindingFormModal = true;
      
      // 加载设备和协议选项
      this.searchDevices('');
      this.searchProtocols('');
    },
    
    async searchDevices(query) {
      this.loadingDevices = true;
      try {
        const result = await listDevicesByAdminId(this.adminId);
        const devices = Array.isArray(result) ? result : 
                       (result && result.data ? result.data : []);
        
        if (query) {
          // 过滤设备列表
          this.deviceOptions = devices.filter(device => 
            device.deviceName.toLowerCase().includes(query.toLowerCase()) ||
            device.deviceCode.toLowerCase().includes(query.toLowerCase())
          );
        } else {
          this.deviceOptions = devices;
        }
      } catch (error) {
        console.error('搜索设备失败:', error);
        ElMessage.error('获取设备列表失败');
        this.deviceOptions = [];
      } finally {
        this.loadingDevices = false;
      }
    },
    
    async searchProtocols(query) {
      this.loadingProtocols = true;
      try {
        const result = await getProtocolList();
        const protocols = Array.isArray(result) ? result : 
                         (result && result.data ? result.data : []);
        
        if (query) {
          // 过滤协议列表
          this.protocolOptions = protocols.filter(protocol => 
            protocol.protocolName.toLowerCase().includes(query.toLowerCase()) ||
            protocol.protocolCode.toLowerCase().includes(query.toLowerCase())
          );
        } else {
          this.protocolOptions = protocols;
        }
      } catch (error) {
        console.error('搜索协议失败:', error);
        ElMessage.error('获取协议列表失败');
        this.protocolOptions = [];
      } finally {
        this.loadingProtocols = false;
      }
    },
    
    async submitBindingForm() {
      // 表单验证
      if (!this.formData.deviceId) {
        ElMessage.warning('请选择设备');
        return;
      }
      if (!this.formData.protocolId) {
        ElMessage.warning('请选择协议');
        return;
      }
      
      this.isLoading = true;
      try {
        // 准备提交到后端的数据
        const submitData = {
          deviceId: this.formData.deviceId,
          protocolId: this.formData.protocolId,
          bindTime: this.formData.bindTime
        };
        
        if (this.formData.id) {
          // 更新绑定关系
          // 由于后端没有提供直接更新的接口，我们先删除旧的绑定，再创建新的
          await deleteByDeviceId(this.formData.deviceId);
          await addDeviceProtocol(submitData);
          ElMessage.success('绑定关系更新成功');
        } else {
          // 新增绑定关系
          await addDeviceProtocol(submitData);
          ElMessage.success('绑定关系添加成功');
        }
        
        // 刷新绑定列表
        this.fetchBindings();
        // 关闭弹窗
        this.closeBindingFormModal();
      } catch (error) {
        console.error('保存绑定关系失败:', error);
        ElMessage.error('保存绑定关系失败: ' + (error.message || '未知错误'));
      } finally {
        this.isLoading = false;
      }
    },
    
    async handleDeleteBinding(id) {
      // 查找对应的绑定关系
      const binding = this.bindingList.find(item => item.id === id);
      if (!binding) {
        ElMessage.error('找不到对应的绑定关系');
        return;
      }
      
      this.isLoading = true;
      try {
        // 删除绑定关系
        await deleteByDeviceId(binding.deviceId);
        ElMessage.success('绑定关系删除成功');
        // 刷新绑定列表
        this.fetchBindings();
      } catch (error) {
        console.error('删除绑定关系失败:', error);
        ElMessage.error('删除绑定关系失败: ' + (error.message || '未知错误'));
      } finally {
        this.isLoading = false;
      }
    },
    
    closeBindingFormModal() {
      this.showBindingFormModal = false;
    }
  },
  mounted() {
    // 加载绑定列表
    this.fetchBindings();
  }
};
</script>

<style lang="scss" scoped>
.text-right {
  text-align: right;
}

.mb-20 {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.no-data {
  padding: 40px 0;
  text-align: center;
}

.data-table {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.table-info {
  margin-right: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 