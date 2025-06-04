<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <h3>{{ isEditing ? "编辑用户" : "新增用户" }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">用户名:</label>
          <input type="text" v-model="localCurrentUser.name" required />
        </div>
        <div class="form-group">
          <label for="role">角色:</label>
          <input type="text" v-model="localCurrentUser.role" required />
        </div>
        <div class="form-group">
          <label>权限:</label>
          <div class="permissions-checkbox-group">
            <div
              v-for="permission in allPermissions"
              :key="permission"
              class="permission-item"
            >
              <input
                type="checkbox"
                :id="'perm-modal-' + permission"
                :value="permission"
                v-model="localCurrentUser.permissions"
              />
              <label :for="'perm-modal-' + permission">{{ permission }}</label>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-success">保存</button>
          <button type="button" @click="closeModal" class="btn btn-secondary">
            取消
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: "UserFormModal",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    editingUser: {
      type: Object,
      default: null,
    },
    currentUserData: {
      type: Object,
      required: true,
    },
    allPermissions: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      localCurrentUser: { permissions: [] }, // Initialize with an empty permissions array
    };
  },
  computed: {
    isEditing() {
      return !!this.editingUser;
    },
  },
  watch: {
    // Watch for changes in currentUserData to update localCurrentUser
    // This is important when the modal is opened for editing an existing user
    // or when it's reset for a new user.
    currentUserData: {
      handler(newData) {
        // Deep clone to avoid mutating prop directly, especially for the permissions array
        this.localCurrentUser = JSON.parse(JSON.stringify(newData));
        // Ensure permissions is always an array
        if (!Array.isArray(this.localCurrentUser.permissions)) {
          this.localCurrentUser.permissions = [];
        }
      },
      immediate: true, // Run the handler immediately when the component is created
      deep: true, // Watch for nested changes if currentUserData is complex
    },
  },
  methods: {
    handleSubmit() {
      this.$emit("save", { ...this.localCurrentUser });
    },
    closeModal() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
/* 将 Admin.vue 中与弹窗相关的样式复制到这里 */
/* 确保选择器是局部的，或者如果样式是通用的，则考虑全局样式文件 */
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
  background-color: #fff;
  padding: 25px 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  width: 450px;
  max-width: 90%;
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-group input[type="text"] {
  width: calc(100% - 22px); /* 减去 padding 和 border */
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
}

.form-group input[type="text"]:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

.permissions-checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  max-height: 150px;
  overflow-y: auto;
}

.permission-item {
  display: flex;
  align-items: center;
}

.permission-item input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.permission-item label {
  font-weight: normal;
  margin-bottom: 0;
  cursor: pointer;
  color: #333;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
}

.modal-actions .btn + .btn {
  margin-left: 10px;
}

/* 按钮样式也需要从 Admin.vue 复制或全局定义 */
.btn {
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  border: none;
  text-transform: capitalize;
}
.btn-success {
  background-color: #28a745;
  color: white;
}
.btn-success:hover {
  background-color: #1e7e34;
  box-shadow: 0 2px 5px rgba(40, 167, 69, 0.3);
}
.btn-secondary {
  background-color: #6c757d;
  color: white;
}
.btn-secondary:hover {
  background-color: #545b62;
  box-shadow: 0 2px 5px rgba(108, 117, 125, 0.3);
}
</style>
