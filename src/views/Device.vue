<template>
  <div class="page-container">
    <el-card class="search-form">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索设备名称或编码..."
            prefix-icon="Search"
            clearable
            @clear="loadLocalDevices"
            @keyup.enter="searchLocalDevices"
          />
        </el-col>
        <el-col :span="8">
          <div>
            <span class="filter-label">状态：</span>
            <el-radio-group v-model="currentStatusFilter" size="large" @change="filterLocalDevices">
            <el-radio-button :label="null">全部</el-radio-button>
            <el-radio-button :label="1">在线</el-radio-button>
            <el-radio-button :label="0">离线</el-radio-button>
            <el-radio-button :label="2">故障</el-radio-button>
          </el-radio-group>
          </div>
        </el-col>
        <el-col :span="8" class="text-right">
          <el-dropdown @command="handleCommand" style="margin-right: 10px;">
            <el-button type="info">
              设置 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="toggleLocationAPI">
                  {{ useOnlineAPI ? '使用离线地图API' : '使用在线地图API' }}
                </el-dropdown-item>
                <el-dropdown-item command="toggleAutoLoadLocation">
                  {{ autoLoadLocation ? '禁用自动加载位置' : '启用自动加载位置' }}
                </el-dropdown-item>
                <el-dropdown-item command="clearLocationCache">清除位置缓存</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" @click="openAddDeviceModal">
            <el-icon><Plus /></el-icon> 添加设备
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="data-table">
      <div class="table-header">
        <div class="table-info">
          <el-tag type="info" v-if="filteredDeviceList.length > 0">
            共 {{ filteredDeviceList.length }} 条数据，当前显示 {{ getPaginationInfo() }}
          </el-tag>
          <el-tag type="info" v-else>暂无数据</el-tag>
        </div>
        <div class="table-actions">
          <el-radio-group v-model="pageSize" size="small" @change="handleSizeChange">
            <el-radio-button :label="5">5条/页</el-radio-button>
            <el-radio-button :label="10">10条/页</el-radio-button>
            <el-radio-button :label="15">15条/页</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-table
        v-loading="isLoading"
        :data="displayDeviceList"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="deviceName" label="设备名称" width="150" />
        <el-table-column label="设备图片" width="150">
          <template #default="scope">
            <el-image 
              v-if="scope.row.deviceCode && scope.row.deviceCode.startsWith('http')"
              :src="scope.row.deviceCode" 
              style="width: 100px; height: 60px" 
              fit="cover"
              :preview-src-list="[scope.row.deviceCode]">
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
            <span v-else>{{ scope.row.deviceCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deviceType" label="类型" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="集成状态" width="120">
          <template #default="scope">
            <el-tag :type="getIntegrationStatusType(scope.row.deviceIntegration)">
              {{ getIntegrationStatusText(scope.row.deviceIntegration) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="位置" width="180">
          <template #default="scope">
            <span v-if="scope.row.locationInfo && scope.row.locationInfo.formatted_address">
              {{ scope.row.locationInfo.formatted_address }}
            </span>
            <span v-else-if="scope.row.isLoadingLocation">
              <el-icon class="is-loading"><Loading /></el-icon> 加载中...
            </span>
            <span v-else-if="scope.row.latitude && scope.row.longitude">
              <el-tooltip :content="`经度: ${scope.row.longitude}, 纬度: ${scope.row.latitude}`">
                <el-button link type="primary" @click="loadLocationInfo(scope.row)">
                  点击查看地区
                </el-button>
              </el-tooltip>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="openEditDeviceModal(scope.row)"
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除此设备吗？"
              @confirm="handleDeleteDevice(scope.row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!isLoading && displayDeviceList.length === 0" class="no-data">
        <el-empty description="暂无设备数据" />
      </div>
      
      <!-- 分页控件 -->
      <div class="pagination-container" v-if="filteredDeviceList.length > 0">
      <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 15]"
          :pager-count="5"
        layout="total, sizes, prev, pager, next, jumper"
          :total="filteredDeviceList.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
          background
      />
      </div>
    </el-card>

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
import DeviceFormModal from "@/components/DeviceFormModal.vue";
import { listDevicesByAdminId, deleteDevice, addDevice, updateDevice } from "@/api/device";
import { ElMessage } from "element-plus";
import { Picture, Plus, ArrowDown, Loading } from '@element-plus/icons-vue';
import { getLocation } from "@/api/location";
import { addDeviceProtocol } from "@/api/deviceProtocol";
import { getProtocolList } from "@/api/protocol";

export default {
  components: { 
    DeviceFormModal,
    Picture,
    Plus,
    ArrowDown,
    Loading
  },
  data() {
    return {
      isLoading: false,
      searchQuery: "",
      currentStatusFilter: null,
      deviceList: [], // 所有设备数据
      filteredDeviceList: [], // 过滤后的设备数据
      displayDeviceList: [], // 当前页显示的设备数据
      showDeviceFormModal: false,
      editingDevice: null,
      adminId: localStorage.getItem('adminId') || 1,
      useOnlineAPI: localStorage.getItem('useOnlineAPI') !== 'false',
      autoLoadLocation: localStorage.getItem('autoLoadLocation') !== 'false',
      currentPage: 1,
      pageSize: parseInt(localStorage.getItem('pageSize') || '10')
    };
  },
  methods: {
    formatDateTime(dateTime) {
      if (!dateTime) return '-';
      const date = new Date(dateTime);
      return date.toLocaleString();
    },
    
    async fetchDevices() {
      this.isLoading = true;
      
      try {
        console.log('尝试获取设备列表, adminId:', this.adminId);
        
        // 判断是否需要使用模拟数据（如果后端服务不可用）
        const useMockData = localStorage.getItem('useMockData') === 'true';
        
        if (useMockData) {
          console.log('使用模拟数据');
          const mockDevices = [
            {
              id: 1,
              deviceName: '测试设备1',
              deviceCode: 'TEST001',
              deviceType: '传感器',
              status: 1,
              latitude: '39.904211',
              longitude: '116.407395',
              deviceIntegration: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              adminId: 1
            },
            {
              id: 2,
              deviceName: '测试设备2',
              deviceCode: 'TEST002',
              deviceType: '摄像头',
              status: 0,
              latitude: '31.230416',
              longitude: '121.473701',
              deviceIntegration: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              adminId: 1
            }
          ];
          
          this.deviceList = mockDevices;
          
          // 加载地理位置信息
          this.preloadLocationInfo(this.deviceList);
          
          // 初始化分页
          this.currentPage = 1;
          this.applyFilters();
          this.updateDisplayList();
          
          ElMessage.success('成功加载模拟数据');
          return;
        }
        
        // 真实请求
        const result = await listDevicesByAdminId(this.adminId);
        console.log('获取到的设备列表:', result);
        
        if (Array.isArray(result)) {
          // 直接是数组结构
          this.deviceList = result;
        } else if (result && result.data && Array.isArray(result.data)) {
          // 包含在data字段中
          this.deviceList = result.data;
        } else {
          // 其他格式，尝试处理
          this.deviceList = [];
          ElMessage.warning('设备数据格式不符合预期');
        }
        
        // 加载地理位置信息
        this.preloadLocationInfo(this.deviceList);
        
        // 初始化分页
        this.currentPage = 1;
        this.applyFilters();
        this.updateDisplayList();
        
        ElMessage.success('成功获取设备列表');
      } catch (error) {
        console.error('获取设备列表失败:', error);
        
        // 尝试开启模拟数据模式
        if (confirm('获取设备列表失败，是否切换到模拟数据模式？')) {
          localStorage.setItem('useMockData', 'true');
          this.fetchDevices(); // 重新获取（使用模拟数据）
          return;
            }
        
        this.deviceList = [];
        this.filteredDeviceList = [];
        this.displayDeviceList = [];
        
        let errorMsg = '获取设备列表失败';
        if (error.response) {
          errorMsg += `: ${error.response.status}`;
          console.log('完整错误响应:', error.response);
          
          if (error.response.data) {
            console.log('错误响应内容:', error.response.data);
          }
        }
        
        ElMessage.error(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },
    
    // 本地加载所有设备（不发送请求）
    loadLocalDevices() {
      console.log("执行loadLocalDevices");
      this.currentPage = 1; // 重置到第一页
      this.applyFilters();
      this.updateDisplayList();
    },
    
    // 本地搜索设备
    searchLocalDevices() {
      if (!this.searchQuery.trim()) {
        this.loadLocalDevices();
        return;
      }
      
      this.currentPage = 1; // 重置到第一页
      this.applyFilters();
      this.updateDisplayList();
    },
    
    // 应用过滤条件
    applyFilters() {
      // 第一步：应用搜索过滤
      let filtered = [...this.deviceList];
      
      // 搜索过滤
      if (this.searchQuery.trim()) {
        const searchText = this.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(device => {
          return (
            (device.deviceName && device.deviceName.toLowerCase().includes(searchText)) ||
            (device.deviceCode && device.deviceCode.toLowerCase().includes(searchText))
          );
        });
      }
      
      // 状态过滤
      if (this.currentStatusFilter !== null) {
        filtered = filtered.filter(device => device.status === this.currentStatusFilter);
      }
      
      this.filteredDeviceList = filtered;
    },
    
    // 更新显示列表（分页）
    updateDisplayList() {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      
      console.log(`分页信息：当前页=${this.currentPage}, 每页=${this.pageSize}, 总数=${this.filteredDeviceList.length}`);
      console.log(`显示范围：${startIndex} 到 ${endIndex}`);
      
      this.displayDeviceList = this.filteredDeviceList.slice(startIndex, endIndex);
      
      console.log(`当前页数据数量: ${this.displayDeviceList.length}`);
    },
    
    // 本地过滤设备状态
    filterLocalDevices(resetPage = true) {
      if (resetPage) {
        this.currentPage = 1;
      }
      
      this.applyFilters();
      this.updateDisplayList();
    },

    openAddDeviceModal() {
      this.editingDevice = null;
      this.showDeviceFormModal = true;
    },
    
    openEditDeviceModal(device) {
      this.editingDevice = { ...device };
      this.showDeviceFormModal = true;
    },
    
    async handleSaveDevice(deviceData) {
      this.isLoading = true;
      try {
        // 准备提交到后端的数据
        const submitData = {
          deviceName: deviceData.deviceName,
          deviceCode: deviceData.deviceCode,
          deviceType: deviceData.deviceType,
          status: deviceData.status,
          adminId: this.adminId,
          latitude: deviceData.latitude || '',
          longitude: deviceData.longitude || '',
          deviceIntegration: deviceData.deviceIntegration,
          createdAt: deviceData.createdAt || new Date().toISOString(),
          updatedAt: deviceData.updatedAt || new Date().toISOString()
        };
        
        let deviceId = deviceData.id;
        let isNewDevice = false;
        
        if (deviceId) {
          // 更新设备
          submitData.id = deviceId;
          await updateDevice(submitData);
          ElMessage.success('设备更新成功');
        } else {
          // 新增设备
          isNewDevice = true;
          const result = await addDevice(submitData);
          
          // 获取新设备的ID
          if (result && result.data) {
            deviceId = result.data;
          } else {
            // 尝试通过设备名称和编码查询新添加的设备
            await this.fetchDevices();
            const newDevice = this.deviceList.find(
              d => d.deviceName === submitData.deviceName && 
                  d.deviceCode === submitData.deviceCode
            );
            if (newDevice) {
              deviceId = newDevice.id;
            }
          }
          
          ElMessage.success('设备添加成功');
        }
        
        // 如果是新设备且获取到了设备ID，尝试创建设备协议绑定
        if (isNewDevice && deviceId) {
          try {
            // 获取可用的协议列表
            const protocolResult = await getProtocolList({});
            const protocols = Array.isArray(protocolResult) ? protocolResult : 
                            (protocolResult && protocolResult.data ? protocolResult.data : []);
            
            // 如果有可用协议，选择第一个进行绑定
            if (protocols.length > 0) {
              const defaultProtocol = protocols.find(p => p.status === 1) || protocols[0];
              
              await addDeviceProtocol({
                deviceId: deviceId,
                protocolId: defaultProtocol.id
              });
              
              console.log(`已为设备(ID=${deviceId})创建协议绑定，协议ID=${defaultProtocol.id}`);
            } else {
              console.log('没有可用的协议，跳过创建设备协议绑定');
            }
          } catch (bindError) {
            console.error('创建设备协议绑定失败:', bindError);
            // 不影响主流程，只记录错误
          }
        }
        
        // 刷新设备列表
        this.fetchDevices();
      } catch (error) {
        console.error('保存设备失败:', error);
        ElMessage.error('保存设备失败: ' + (error.message || '未知错误'));
      } finally {
        this.isLoading = false;
        this.closeDeviceFormModal();
      }
    },
    
    async handleDeleteDevice(id) {
      this.isLoading = true;
      try {
        await deleteDevice(id);
        ElMessage.success('设备删除成功');
        // 刷新设备列表
        this.fetchDevices();
      } catch (error) {
        console.error('删除设备失败:', error);
        ElMessage.error('删除设备失败: ' + (error.message || '未知错误'));
      } finally {
        this.isLoading = false;
      }
    },
    
    closeDeviceFormModal() {
      this.showDeviceFormModal = false;
      this.editingDevice = null;
    },

    async loadLocationInfo(device) {
      if (device.isLoadingLocation) return;
      
      // 设置加载状态
      device.isLoadingLocation = true;
      
      try {
        console.log(`手动加载设备${device.id}的位置信息:`, device.longitude, device.latitude);
        const locationInfo = await getLocation(device.longitude, device.latitude);
        console.log(`设备${device.id}的位置信息加载完成:`, locationInfo);
        
        // 更新设备对象的位置信息
        if (locationInfo && locationInfo.formatted_address) {
          device.locationInfo = locationInfo;
          ElMessage.success(`已加载位置信息: ${locationInfo.formatted_address}`);
        } else {
          console.warn(`设备${device.id}的位置信息无效:`, locationInfo);
          device.locationInfo = {
            province: '未知省份',
            city: '未知城市',
            district: '未知区县',
            formatted_address: '位置解析失败'
          };
          ElMessage.warning('无法获取有效的位置信息');
        }
      } catch (error) {
        console.error('加载位置信息失败:', error);
        device.locationInfo = {
          province: '未知省份',
          city: '未知城市',
          district: '未知区县',
          formatted_address: '位置解析失败'
        };
        ElMessage.error('无法获取位置信息: ' + (error.message || '未知错误'));
      } finally {
        device.isLoadingLocation = false;
      }
    },

    // 自动加载地理位置信息
    preloadLocationInfo(devices) {
      // 只尝试加载有经纬度的设备的地理位置信息
      const devicesWithCoordinates = devices.filter(device => 
        device.latitude && device.longitude && 
        !device.isLoadingLocation && !device.locationInfo
      );
      
      if (devicesWithCoordinates.length === 0) return;
      
      // 是否自动加载位置信息（从本地存储获取设置）
      const autoLoadLocation = localStorage.getItem('autoLoadLocation') !== 'false';
      
      if (autoLoadLocation) {
        console.log(`开始加载${devicesWithCoordinates.length}个设备的位置信息`);
        
        // 使用Promise.all并行加载所有设备的位置信息
        Promise.all(
          devicesWithCoordinates.map(async device => {
            try {
              device.isLoadingLocation = true;
              console.log(`加载设备${device.id}的位置信息:`, device.longitude, device.latitude);
              
              const locationInfo = await getLocation(device.longitude, device.latitude);
              console.log(`设备${device.id}的位置信息加载完成:`, locationInfo);
              
              if (locationInfo && locationInfo.formatted_address) {
                device.locationInfo = locationInfo;
              } else {
                console.warn(`设备${device.id}的位置信息无效:`, locationInfo);
                device.locationInfo = {
                  province: '未知省份',
                  city: '未知城市',
                  district: '未知区县',
                  formatted_address: '位置解析失败'
                };
              }
            } catch (error) {
              console.error(`设备${device.id}的位置信息加载失败:`, error);
              device.locationInfo = {
                province: '未知省份',
                city: '未知城市',
                district: '未知区县',
                formatted_address: '位置解析失败'
              };
            } finally {
              device.isLoadingLocation = false;
            }
          })
        ).then(() => {
          console.log('所有设备的位置信息加载完成');
        }).catch(error => {
          console.error('加载位置信息时发生错误:', error);
        });
      }
    },

    handleCommand(command) {
      if (command === 'toggleLocationAPI') {
        this.useOnlineAPI = !this.useOnlineAPI;
        localStorage.setItem('useOnlineAPI', this.useOnlineAPI.toString());
        ElMessage.success(`已${this.useOnlineAPI ? '启用' : '禁用'}在线地图API`);
        
        // 刷新位置信息
        this.refreshLocationInfo();
      } else if (command === 'toggleAutoLoadLocation') {
        this.autoLoadLocation = !this.autoLoadLocation;
        localStorage.setItem('autoLoadLocation', this.autoLoadLocation.toString());
        ElMessage.success(`已${this.autoLoadLocation ? '启用' : '禁用'}自动加载位置信息`);
        
        // 如果启用了自动加载，则立即加载位置信息
        if (this.autoLoadLocation) {
          this.refreshLocationInfo();
        }
      } else if (command === 'clearLocationCache') {
        // 清除所有设备的位置信息
        this.deviceList.forEach(device => {
          device.locationInfo = null;
          device.isLoadingLocation = false;
        });
        this.filteredDeviceList.forEach(device => {
          device.locationInfo = null;
          device.isLoadingLocation = false;
        });
        this.displayDeviceList.forEach(device => {
          device.locationInfo = null;
          device.isLoadingLocation = false;
        });
        ElMessage.success('已清除位置信息缓存');
      }
    },

    // 刷新所有设备的位置信息
    refreshLocationInfo() {
      this.deviceList.forEach(device => {
        device.locationInfo = null;
        device.isLoadingLocation = false;
      });
      
      if (this.autoLoadLocation) {
        this.preloadLocationInfo(this.deviceList);
      }
    },

    handleSizeChange(newSize) {
      console.log(`改变每页显示数: ${newSize}`);
      this.pageSize = newSize;
      localStorage.setItem('pageSize', newSize.toString());
      this.currentPage = 1; // 重置到第一页
      this.updateDisplayList();
    },

    handleCurrentChange(newPage) {
      console.log(`切换到页码: ${newPage}`);
      this.currentPage = newPage;
      this.updateDisplayList();
    },

    getPaginationInfo() {
      const startIndex = (this.currentPage - 1) * this.pageSize + 1;
      const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredDeviceList.length);
      return `第 ${startIndex} - ${endIndex} 条，共 ${this.filteredDeviceList.length} 条`;
    },

    getIntegrationStatusType(deviceIntegration) {
      if (deviceIntegration === 1) return 'primary';
      if (deviceIntegration === 0) return 'info';
      if (deviceIntegration === 3) return 'danger';
      return 'info';
    },

    getIntegrationStatusText(deviceIntegration) {
      if (deviceIntegration === 1) return '已集成';
      if (deviceIntegration === 0) return '未集成';
      if (deviceIntegration === 3) return '已拒绝';
      return '未知状态';
    },

    getStatusType(status) {
      switch (status) {
        case 1:
          return 'success'
        case 0:
          return 'info'
        case 2:
          return 'danger'
        default:
          return 'info'
      }
    },

    getStatusText(status) {
      switch (status) {
        case 1:
          return '在线'
        case 0:
          return '离线'
        case 2:
          return '故障'
        default:
          return '未知'
      }
    },

    // 更新设备状态
    async updateDeviceStatus(deviceId, newStatus) {
      try {
        const response = await request.put(`/api/device/${deviceId}/status`, {
          status: newStatus
        })
        if (response.code === 0) {
          ElMessage.success('设备状态更新成功')
          // 更新本地设备列表
          const device = this.deviceList.find(d => d.id === deviceId)
          if (device) {
            const oldStatus = device.status
            device.status = newStatus
            // 计算在线设备数量的变化
            const oldOnlineCount = this.deviceList.filter(d => d.status === 1).length
            const newOnlineCount = oldOnlineCount + (newStatus === 1 ? 1 : 0) - (oldStatus === 1 ? 1 : 0)
            // 更新localStorage中的在线设备数记录
            localStorage.setItem('lastOnlineDevices', oldOnlineCount.toString())
          }
        }
      } catch (error) {
        console.error('更新设备状态失败:', error)
        ElMessage.error('更新设备状态失败')
      }
    }
  },
  mounted() {
    // 从本地存储恢复分页设置
    const savedPageSize = localStorage.getItem('pageSize');
    if (savedPageSize) {
      this.pageSize = parseInt(savedPageSize);
    }
    
    console.log("组件挂载，初始页面大小:", this.pageSize);
    
    // 加载设备列表
    this.fetchDevices();
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredDeviceList.length / this.pageSize) || 1;
    }
  },
  watch: {
    // 监听过滤器变化，自动更新分页
    currentStatusFilter() {
      this.currentPage = 1; // 重置到第一页
      this.filterLocalDevices(false);
    },
    
    // 监听页面大小变化，自动更新显示
    pageSize() {
      this.updateDisplayList();
    },
    
    // 监听当前页变化，确保不超出范围
    currentPage(newPage) {
      console.log(`当前页变为: ${newPage}, 总页数: ${this.totalPages}`);
      // 确保当前页不超出总页数
      if (newPage > this.totalPages) {
        console.log(`页码越界，重置为: ${this.totalPages}`);
        this.$nextTick(() => {
          this.currentPage = this.totalPages;
        });
      }
    },
    
    // 监听筛选后的数据列表变化
    filteredDeviceList: {
      handler(newList) {
        console.log(`筛选后数据变化，数量: ${newList.length}`);
        // 当数据变化导致总页数减少，且当前页超出新的总页数范围时
        if (this.currentPage > this.totalPages) {
          console.log(`数据变化导致页码越界，重置为: ${this.totalPages}`);
          this.currentPage = this.totalPages;
        }
        this.updateDisplayList();
      },
      deep: true
    }
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

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 60px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 12px;
  
  .el-icon {
    font-size: 20px;
    margin-bottom: 8px;
  }
}

.pagination-container {
  margin-top: 20px;
  padding: 10px 0;
  text-align: right;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

.el-pagination {
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: flex-end;
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

.table-actions {
  margin-right: 20px;
}

.filter-label {
  margin-right: 10px;
}
</style>
