<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h3>{{ formTitle }}</h3>
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="deviceName">设备名称:</label>
          <input type="text" id="deviceName" v-model="formData.name" required>
        </div>
        <div class="form-group">
          <label for="deviceType">设备类型:</label>
          <input type="text" id="deviceType" v-model="formData.type" required>
        </div>
        <div class="form-group">
          <label for="deviceLocation">位置描述:</label> <input type="text" id="deviceLocation" v-model="formData.location">
        </div>
        <div class="form-group">
          <label for="deviceLongitude">经度:</label>
          <input type="number" step="any" id="deviceLongitude" v-model.number="formData.longitude">
        </div>
        <div class="form-group">
          <label for="deviceLatitude">纬度:</label>
          <input type="number" step="any" id="deviceLatitude" v-model.number="formData.latitude">
        </div>
        <div class="form-group">
          <label for="deviceFirmware">固件版本:</label>
          <input type="text" id="deviceFirmware" v-model="formData.firmware">
        </div>
        <div class="form-group">
          <label for="deviceStatus">状态:</label>
          <select id="deviceStatus" v-model="formData.status">
            <option value="online">在线</option>
            <option value="offline">离线</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="button" @click="closeModal" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary">保存</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
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
      formData: {
        id: null,
        name: '',
        type: '',
        location: '', // 保留，用于描述性位置
        longitude: null, // 新增经度
        latitude: null,  // 新增纬度
        firmware: '',
        status: 'online' // 默认状态
      }
    };
  },
  computed: {
    formTitle() {
      return this.editingDeviceData ? '编辑设备' : '添加新设备';
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        if (this.editingDeviceData) {
          // 编辑模式，填充表单
          this.formData = { ...this.editingDeviceData };
        } else {
          // 新增模式，重置表单
          this.resetForm();
        }
      }
    }
  },
  methods: {
    resetForm() {
      this.formData = {
        id: null,
        name: '',
        type: '',
        location: '',
        longitude: null,
        latitude: null,
        firmware: '',
        status: 'online'
      };
    },
    closeModal() {
      this.$emit('close');
    },
    submitForm() {
      // 在这里可以添加表单校验逻辑
      const deviceToSave = { ...this.formData };
      if (!this.editingDeviceData) { // 如果是新增，可以生成一个临时ID或由后端生成
        // deviceToSave.id = Date.now().toString(); // 仅为示例
      }
      this.$emit('save', deviceToSave);
      // closeModal(); // 保存后通常会关闭弹窗，父组件会处理
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 25px 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 450px;
  max-width: 90%;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5em;
  text-align: center;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}

.form-group input[type="text"],
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1em;
}

.form-group input[type="text"]:focus,
.form-group select:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-actions {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 18px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  border: none;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #f0f2f5;
  color: #555;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background-color: #e7e9ec;
}
</style>