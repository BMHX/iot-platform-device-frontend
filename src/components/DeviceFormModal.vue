<template>
  <el-dialog
    v-model="dialogVisible"
    :title="formTitle"
    width="600px"
    @close="closeModal"
  >
    <el-form :model="formData" label-width="100px" label-position="right">
      <el-form-item label="设备名称" required>
        <el-input v-model="formData.deviceName" />
      </el-form-item>
      <el-form-item label="设备图片" required>
        <el-input 
          v-model="formData.deviceCode" 
          placeholder="请输入图片URL或设备编码"
        />
        <div v-if="isImageUrl(formData.deviceCode)" class="image-preview">
          <el-image 
            :src="formData.deviceCode" 
            style="width: 150px; height: 90px" 
            fit="cover">
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <span>图片加载失败</span>
              </div>
            </template>
          </el-image>
        </div>
        <div v-else class="tip-text">
          提示：如果输入以http开头的URL，将显示为图片
        </div>
      </el-form-item>
      <el-form-item label="设备类型" required>
        <el-input v-model="formData.deviceType" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="formData.status" style="width: 100%">
          <el-option label="在线" :value="1" />
          <el-option label="离线" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="位置信息">
        <div class="location-selector">
          <div class="location-info" v-if="formData.latitude && formData.longitude">
            <div><strong>经度:</strong> {{ formData.longitude }}</div>
            <div><strong>纬度:</strong> {{ formData.latitude }}</div>
          </div>
          <el-button type="primary" size="small" @click="showMapSelector = true">
            {{ formData.latitude && formData.longitude ? '修改位置' : '选择位置' }}
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="地区信息">
        <div v-if="isValidCoordinates" class="location-container">
          <div v-if="locationInfo && !isLoadingLocation">
            <div>{{ locationInfo.formatted_address }}</div>
            <div class="location-detail">
              <span>省份: {{ locationInfo.province }}</span>
              <span>城市: {{ locationInfo.city }}</span>
              <span>区县: {{ locationInfo.district }}</span>
            </div>
          </div>
          <div v-else-if="isLoadingLocation" class="loading-text">
            正在获取地区信息...
          </div>
          <el-button 
            v-else 
            type="primary" 
            size="small"
            @click="loadLocationInfo"
          >
            获取地区信息
          </el-button>
        </div>
        <div v-else class="tip-text">
          请先选择位置
        </div>
      </el-form-item>
      <el-form-item label="集成状态">
        <el-select v-model="formData.deviceIntegration" style="width: 100%">
          <el-option label="未集成" :value="0" />
          <el-option label="已集成" :value="1" />
          <el-option label="已拒绝" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="formData.createdAt"
          type="datetime"
          placeholder="选择创建时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker
          v-model="formData.updatedAt"
          type="datetime"
          placeholder="选择更新时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeModal">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 地图选择对话框 -->
  <el-dialog
    v-model="showMapSelector"
    title="选择设备位置"
    width="800px"
    :close-on-click-modal="false"
    :append-to-body="true"
    destroy-on-close
  >
    <map-selector
      :initial-longitude="formData.longitude || 116.397428"
      :initial-latitude="formData.latitude || 39.90923"
      @location-selected="handleLocationSelected"
    />
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeMapSelector">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ElMessage } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
import { getLocation } from '@/api/location';
import MapSelector from './MapSelector.vue';

export default {
  components: {
    Picture,
    MapSelector
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    editingDeviceData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      dialogVisible: false,
      formData: {
        id: null,
        deviceName: '',
        deviceCode: '',
        deviceType: '',
        status: 1,
        latitude: '',
        longitude: '',
        deviceIntegration: 0,
        adminId: 1 // 固定使用管理员ID为1
      },
      locationInfo: null,
      isLoadingLocation: false,
      showMapSelector: false
    };
  },
  computed: {
    formTitle() {
      return this.editingDeviceData ? '编辑设备' : '添加新设备';
    },
    isValidCoordinates() {
      return this.formData.latitude && this.formData.longitude;
    },
    isEditMode() {
      return this.editingDeviceData !== null;
    }
  },
  watch: {
    visible(newVal) {
      this.dialogVisible = newVal;
      if (newVal) {
        if (this.editingDeviceData) {
          // 编辑模式，填充表单
          this.formData = {
            id: this.editingDeviceData.id,
            deviceName: this.editingDeviceData.deviceName || '',
            deviceCode: this.editingDeviceData.deviceCode || '',
            deviceType: this.editingDeviceData.deviceType || '',
            status: this.editingDeviceData.status,
            latitude: this.editingDeviceData.latitude || '',
            longitude: this.editingDeviceData.longitude || '',
            deviceIntegration: this.editingDeviceData.deviceIntegration || 0,
            adminId: 1,
            createdAt: this.formatDateTime(this.editingDeviceData.createdAt),
            updatedAt: this.formatDateTime(this.editingDeviceData.updatedAt)
          };
          
          // 如果有经纬度，自动获取地区信息
          if (this.isValidCoordinates) {
            this.loadLocationInfo();
          }
        } else {
          // 新增模式，重置表单
          this.resetForm();
        }
      }
    },
    'formData.latitude'() {
      // 经纬度变化，清除之前的地区信息
      this.locationInfo = null;
    },
    'formData.longitude'() {
      // 经纬度变化，清除之前的地区信息
      this.locationInfo = null;
    }
  },
  methods: {
    isImageUrl(url) {
      return typeof url === 'string' && url.trim().toLowerCase().startsWith('http');
    },
    resetForm() {
      const now = this.formatDate(new Date());
      this.formData = {
        id: null,
        deviceName: '',
        deviceCode: '',
        deviceType: '',
        status: 1,
        latitude: '',
        longitude: '',
        deviceIntegration: 0,
        adminId: 1,
        createdAt: now,
        updatedAt: now
      };
    },
    closeModal() {
      this.$emit('close');
    },
    submitForm() {
      // 表单验证
      if (!this.formData.deviceName) {
        ElMessage.warning('请输入设备名称');
        return;
      }
      if (!this.formData.deviceCode) {
        ElMessage.warning('请输入设备图片URL或编码');
        return;
      }
      if (!this.formData.deviceType) {
        ElMessage.warning('请输入设备类型');
        return;
      }
      
      const deviceToSave = { ...this.formData };
      this.$emit('save', deviceToSave);
    },
    async loadLocationInfo() {
      if (!this.isValidCoordinates) {
        ElMessage.warning('请先输入有效的经纬度坐标');
        return;
      }
      
      this.isLoadingLocation = true;
      
      try {
        const locationInfo = await getLocation(this.formData.longitude, this.formData.latitude);
        this.locationInfo = locationInfo;
        console.log('获取到地区信息:', locationInfo);
      } catch (error) {
        console.error('获取地区信息失败:', error);
        ElMessage.error('无法获取地区信息');
      } finally {
        this.isLoadingLocation = false;
      }
    },
    formatDateTime(dateTime) {
      if (!dateTime) return null;
      
      if (typeof dateTime === 'string') {
        // 检查是否是ISO格式
        if (dateTime.includes('T') && dateTime.includes('Z')) {
          // ISO格式，直接转换
          const date = new Date(dateTime);
          return this.formatDate(date);
        } else {
          // 尝试解析非ISO格式
          const date = new Date(dateTime);
          if (!isNaN(date.getTime())) {
            return this.formatDate(date);
          }
        }
      } else if (dateTime instanceof Date) {
        return this.formatDate(dateTime);
      }
      
      // 无法解析，返回null
      return null;
    },
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    closeMapSelector() {
      this.showMapSelector = false;
    },
    handleLocationSelected(location) {
      console.log('选择的位置:', location);
      this.formData.longitude = location.longitude;
      this.formData.latitude = location.latitude;
      
      // 自动获取地区信息
      this.loadLocationInfo();
      
      // 关闭地图选择器
      this.closeMapSelector();
      
      ElMessage.success('位置已更新');
    }
  }
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.image-preview {
  margin-top: 10px;
  padding: 5px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: inline-block;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 90px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.image-error .el-icon {
  font-size: 20px;
  margin-bottom: 8px;
}

.tip-text {
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
}

.location-container {
  margin-top: 10px;
  padding: 5px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: inline-block;
}

.location-detail {
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
}

.loading-text {
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
}

.location-selector {
  margin-top: 10px;
  padding: 5px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: inline-block;
}

.location-info {
  margin-bottom: 10px;
}
</style>