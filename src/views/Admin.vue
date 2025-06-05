<template>
  <div class="admin-container">
    <div class="user-profile-card">
      <h2>个人中心</h2>
      <div class="profile-details">
        <div class="detail-item">
          <span class="label">当前账号 (ID):</span>
          <span class="value">{{ userId || "未设置" }}</span>
        </div>
        <div class="detail-item">
          <span class="label">登录用户名:</span>
          <span class="value">{{ username || "未登录" }}</span>
        </div>
      </div>

      <div class="permissions-section">
        <h3>我的权限套餐</h3>
        <div v-if="userPermissions.length > 0" class="current-permissions">
          <h4>当前已拥有权限:</h4>
          <ul class="permissions-list purchased">
            <li
              v-for="permission in userPermissions"
              :key="permission"
              class="permission-item"
            >
              {{ getPermissionDisplayName(permission) }}
            </li>
          </ul>
        </div>
        <p v-else class="no-permissions">您当前尚未购买任何权限套餐。</p>
      </div>

      <div class="套餐购买-section">
        <h3>权限套餐商店</h3>
        <div class="套餐-grid">
          <div
            v-for="套餐 in availablePackages"
            :key="套餐.id"
            class="套餐-card"
          >
            <h4>{{ 套餐.name }}</h4>
            <p class="套餐-description">{{ 套餐.description }}</p>
            <ul class="套餐-permissions-list">
              <!-- 直接遍历套餐.permissions，因为它是权限ID字符串数组 -->
              <li v-for="permId in 套餐.permissions" :key="permId">
                {{ getPermissionDisplayName(permId) }}
                <span
                  v-if="userPermissions.includes(permId)"
                  class="owned-badge"
                  >(已拥有)</span
                >
              </li>
            </ul>
            <p class="套餐-price">价格: {{ 套餐.price }}</p>
            <button
              @click="purchasePackage(套餐)"
              class="purchase-button"
              :disabled="isPackageFullyOwned(套餐)"
            >
              {{ isPackageFullyOwned(套餐) ? "已全部拥有" : "购买此套餐" }}
            </button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="showUserIdModal = true" class="action-button">
          修改用户ID
        </button>
        <button @click="showPasswordModal = true" class="action-button">
          修改登录密码
        </button>
      </div>
    </div>

    <!-- 修改用户ID弹窗 -->
    <div v-if="showUserIdModal" class="modal-overlay">
      <div class="modal-content">
        <h3>修改用户ID</h3>
        <form @submit.prevent="handleChangeUserId">
          <div class="form-group">
            <label for="currentPasswordForId">当前密码:</label>
            <input
              type="password"
              id="currentPasswordForId"
              v-model="currentPasswordForId"
              required
            />
          </div>
          <div class="form-group">
            <label for="newUserId">新用户ID:</label>
            <input type="text" id="newUserId" v-model="newUserId" required />
          </div>
          <div v-if="userIdError" class="error-message">{{ userIdError }}</div>
          <div class="modal-actions">
            <button type="submit" class="submit-button">确认修改</button>
            <button
              type="button"
              @click="showUserIdModal = false"
              class="cancel-button"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <div v-if="showPasswordModal" class="modal-overlay">
      <div class="modal-content">
        <h3>修改登录密码</h3>
        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label for="currentPassword">当前密码:</label>
            <input
              type="password"
              id="currentPassword"
              v-model="currentPassword"
              required
            />
          </div>
          <div class="form-group">
            <label for="newPassword">新密码:</label>
            <input
              type="password"
              id="newPassword"
              v-model="newPassword"
              required
            />
          </div>
          <div class="form-group">
            <label for="confirmNewPassword">确认新密码:</label>
            <input
              type="password"
              id="confirmNewPassword"
              v-model="confirmNewPassword"
              required
            />
          </div>
          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>
          <div class="modal-actions">
            <button type="submit" class="submit-button">确认修改</button>
            <button
              type="button"
              @click="showPasswordModal = false"
              class="cancel-button"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AdminView",
  data() {
    return {
      userId: null, // 初始化 userId
      userProfile: null,
      username: "",
      userPermissions: [], // 将存储从后端获取的数字权限ID数组
      availablePackages: [], // 将存储从后端获取的套餐对象数组
      showUserIdModal: false,
      showPasswordModal: false,
      currentPasswordForId: "",
      newUserId: "",
      userIdError: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      passwordError: "",
      permissionDisplayNames: {
        // 根据您的第三张 permission 表 (id, name) 进行映射
        1: "个人中心",
        2: "设备管理",
        3: "设备对接",
        4: "告警管理",
        5: "消息中心页面",
        6: "统计分析页面",
        7: "物联大屏",
        // 请根据您 permission 表的实际内容补充和修正
      },
    };
  },
  created() {
    // 新增日志：检查 created 钩子中 localStorage 的 userId
    const storedUserId = localStorage.getItem("userId");
    console.log("[Admin.vue created] userId from localStorage:", storedUserId);

    if (storedUserId) {
      this.userId = storedUserId;
      this.fetchUserProfile();
      this.fetchAvailablePackages(); // 确保这里被调用
    } else {
      console.error(
        "[Admin.vue created] No userId found in localStorage. Redirecting to login."
      );
      // 根据您的应用逻辑，可能需要重定向到登录页
    }
  },
  methods: {
    async fetchUserProfile() {
      if (!this.userId) {
        console.error("User ID is not available.");
        // 根据您的应用逻辑，可能需要重定向到登录页或显示错误信息
        this.username = "用户ID丢失"; // 或其他提示信息
        return;
      }
      try {
        const response = await this.$axios.get(
          `/api/user/profile/${this.userId}`
        );
        const data = response.data; // 假设后端直接返回了您展示的JSON对象
        console.log("Fetched user profile data:", data); // 打印获取到的数据

        if (data) {
          this.userProfile = data; // 存储完整的用户配置信息
          this.username = data.username; // 确保这里正确赋值
          console.log("Username set to:", this.username); // 确认username是否被赋值

          // 更新：从 currentPackage.permissions 获取权限
          if (data.currentPackage && data.currentPackage.permissions) {
            this.userPermissions = data.currentPackage.permissions;
          } else {
            this.userPermissions = []; // 如果没有权限信息，则设置为空数组
          }
          console.log("User Permissions set to:", this.userPermissions);
        } else {
          console.error("No data received from user profile API.");
          this.username = "数据加载失败";
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        this.username = "加载出错"; // 出错时给用户一个提示
        // 处理错误，例如显示错误消息给用户
        if (error.response) {
          // 请求已发出，但服务器响应的状态码不在 2xx 范围内
          console.error("Error response data:", error.response.data);
          console.error("Error response status:", error.response.status);
          // 根据不同的状态码可以给出更具体的错误提示
          if (error.response.status === 401) {
            this.username = "未授权访问";
            // 可能需要跳转到登录页
          } else if (error.response.status === 404) {
            this.username = "用户信息未找到";
          }
        } else if (error.request) {
          // 请求已发出，但没有收到任何响应
          console.error("Error request:", error.request);
          this.username = "网络请求失败";
        } else {
          // 在设置请求时触发了一个错误
          console.error("Error message:", error.message);
        }
      }
    },
    async fetchAvailablePackages() {
      console.log("[Admin.vue fetchAvailablePackages] Method called."); // 新增日志
      try {
        const token = localStorage.getItem("token");
        console.log(
          "[Admin.vue fetchAvailablePackages] Token from localStorage:",
          token
        ); // 新增日志

        const response = await fetch("/api/permissions/packages", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(
          "[Admin.vue fetchAvailablePackages] Response status:",
          response.status
        ); // 新增日志

        if (!response.ok) {
          let errorText = await response.text(); //尝试获取文本错误信息
          console.error(
            "[Admin.vue fetchAvailablePackages] Fetch error, status:",
            response.status,
            "Error text:",
            errorText
          ); // 新增日志
          throw new Error(
            `获取权限套餐失败: ${response.status} - ${errorText}`
          );
        }

        const packagesData = await response.json();
        console.log(
          "[Admin.vue fetchAvailablePackages] Raw packagesData from API:",
          JSON.stringify(packagesData, null, 2)
        ); // 新增日志，美化输出

        this.availablePackages = Array.isArray(packagesData)
          ? packagesData.map((pkg) => ({
              ...pkg,
              permissions: Array.isArray(pkg.permissions)
                ? pkg.permissions.map(Number)
                : [],
            }))
          : [];
        console.log(
          "[Admin.vue fetchAvailablePackages] Processed this.availablePackages:",
          JSON.stringify(this.availablePackages, null, 2)
        ); // 新增日志
      } catch (error) {
        console.error(
          "[Admin.vue fetchAvailablePackages] Error fetching packages:",
          error
        );
        alert(error.message || "无法加载权限套餐，请稍后再试。");
        this.availablePackages = []; // 确保出错时 availablePackages 为空数组
      }
    },
    getPermissionDisplayName(permissionId) {
      // permissionId 预计是数字
      return (
        this.permissionDisplayNames[permissionId] || `权限ID: ${permissionId}`
      );
    },
    isPackageFullyOwned(pkg) {
      if (!pkg || !Array.isArray(pkg.permissions)) {
        return false;
      }
      // pkg.permissions 和 this.userPermissions 都应该是数字数组
      return pkg.permissions.every((permId) =>
        this.userPermissions.includes(Number(permId))
      );
    },
    async purchasePackage(pkg) {
      if (this.isPackageFullyOwned(pkg)) {
        alert(`您已拥有 ${pkg.name} 中的所有权限！`);
        return;
      }
      try {
        const response = await fetch("/api/user/purchase-package", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ packageId: pkg.id }), // pkg.id 是套餐ID
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "购买失败，请稍后再试" }));
          throw new Error(errorData.message || "购买失败");
        }
        const data = await response.json();
        // 假设后端返回更新后的用户权限列表 (数字ID数组)
        this.userPermissions = Array.isArray(data.updatedPermissions)
          ? data.updatedPermissions.map(Number)
          : this.userPermissions;
        alert(`${pkg.name} 购买成功！${data.message || ""}`);
        // 购买成功后，可能需要重新获取用户权限以确保最新状态，或者后端直接返回新的权限列表
        // await this.fetchUserProfile();
      } catch (error) {
        console.error("Error purchasing package:", error);
        alert(error.message);
      }
    },
    async handleChangeUserId() {
      this.userIdError = "";
      if (this.newUserId.trim() === "") {
        this.userIdError = "新用户ID不能为空。";
        return;
      }
      try {
        const response = await fetch("/api/user/user-id", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            currentPassword: this.currentPasswordForId,
            newUserId: this.newUserId,
          }),
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "修改用户ID失败" }));
          throw new Error(errorData.message || "修改用户ID失败");
        }
        const data = await response.json();
        this.userId = data.newUserId || this.newUserId; // 优先使用后端返回的，其次是前端输入的
        this.showUserIdModal = false;
        this.currentPasswordForId = "";
        this.newUserId = "";
        alert(data.message || "用户ID修改成功！");
      } catch (error) {
        console.error("Error changing user ID:", error);
        this.userIdError = error.message;
      }
    },
    async handleChangePassword() {
      this.passwordError = "";
      if (this.newPassword !== this.confirmNewPassword) {
        this.passwordError = "新密码和确认密码不匹配。";
        return;
      }
      if (this.newPassword.length < 6) {
        // 示例：密码长度校验
        this.passwordError = "新密码长度至少为6位。";
        return;
      }
      try {
        const response = await fetch("/api/user/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            currentPassword: this.currentPassword,
            newPassword: this.newPassword,
          }),
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "修改密码失败" }));
          throw new Error(errorData.message || "修改密码失败");
        }
        const data = await response.json();
        this.showPasswordModal = false;
        this.currentPassword = "";
        this.newPassword = "";
        this.confirmNewPassword = "";
        alert(data.message || "密码修改成功！");
      } catch (error) {
        console.error("Error changing password:", error);
        this.passwordError = error.message;
      }
    },
  },
};
</script>

<style scoped>
.admin-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.user-profile-card {
  background-color: #ffffff; /* 白色背景 */
  border-radius: 12px; /* 更大的圆角 */
  padding: 25px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); /* 更明显的阴影 */
  margin-bottom: 30px; /* 与下方元素的间距 */
}

.user-profile-card h2 {
  text-align: center; /* 标题居中 */
  color: #2c3e50; /* 深蓝灰色标题 */
  margin-bottom: 25px;
  font-size: 1.8em;
  font-weight: 600;
}

.profile-details {
  margin-bottom: 25px;
}

.detail-item {
  display: flex; /* 使用 Flexbox 布局 */
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  padding: 12px 0; /* 上下内边距 */
  border-bottom: 1px solid #ecf0f1; /* 浅灰色分隔线 */
}

.detail-item:last-child {
  border-bottom: none; /* 最后一项移除分隔线 */
}

.detail-item .label {
  font-weight: 500; /* 标签加粗 */
  color: #34495e; /* 较深的标签颜色 */
  font-size: 1em;
}

.detail-item .value {
  color: #555; /* 值颜色 */
  font-size: 1em;
  background-color: #f8f9fa; /* 值的浅色背景 */
  padding: 5px 10px;
  border-radius: 4px; /* 轻微圆角 */
}

.permissions-section h3,
.套餐购买-section h3 {
  color: #444;
  margin-top: 30px;
  margin-bottom: 15px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.current-permissions h4 {
  color: #555;
  margin-bottom: 10px;
}

.permissions-list,
.套餐-permissions-list {
  list-style-type: none;
  padding-left: 0;
}

.permissions-list li,
.套餐-permissions-list li {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 0.95em;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.owned-badge {
  background-color: #d4edda; /* 绿色背景 */
  color: #155724; /* 深绿色文字 */
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  margin-left: 10px;
}

.no-permissions {
  color: #777;
  font-style: italic;
}

.套餐-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.套餐-card {
  background: rgba(255, 255, 255, 0.2); /* 半透明背景 */
  backdrop-filter: blur(10px); /* 背景模糊，这是玻璃效果的关键 */
  -webkit-backdrop-filter: blur(10px); /* 兼容 Safari */
  border-radius: 15px; /* 圆角 */
  border: 1px solid rgba(255, 255, 255, 0.3); /* 轻微的白色边框，增加玻璃感 */
  padding: 20px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); /* 更柔和的阴影 */
  color: #333; /*确保文字颜色在半透明背景下清晰可见*/
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 使内容垂直分布，按钮在底部 */
}

.套餐-card:hover {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5);
}

/* 您可能还需要调整卡片内元素的颜色以确保可读性 */
.套餐-card h4 {
  color: #1a1a1a; /* 深色标题 */
  margin-bottom: 10px;
}

.套餐-card .套餐-description {
  color: #4d4d4d; /* 稍浅的描述文字 */
  font-size: 0.9em;
  margin-bottom: 15px;
  flex-grow: 1; /* 让描述占据更多空间 */
}

.套餐-card .套餐-permissions-list {
  list-style: none;
  padding: 0;
  margin-bottom: 15px;
}

.套餐-card .套餐-permissions-list li {
  color: #333;
  font-size: 0.85em;
  margin-bottom: 5px;
}

.套餐-card .套餐-price {
  color: #007bff; /* 价格颜色，可以根据您的主题调整 */
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 15px;
  text-align: right;
}

.purchase-button {
  background-color: rgba(0, 123, 255, 0.7); /* 按钮背景也带些透明 */
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  align-self: flex-end; /* 按钮靠右下 */
}

.purchase-button:hover:not(:disabled) {
  background-color: rgba(0, 123, 255, 1);
}

.purchase-button:disabled {
  background-color: rgba(108, 117, 125, 0.5); /* 禁用状态的按钮样式 */
  cursor: not-allowed;
}

/* 为了让玻璃效果更明显，可能需要一个有内容的背景 */
.admin-container {
  /* 示例：可以给父容器一个背景图或者渐变色 */
  /* background-image: url('path/to/your/background-image.jpg'); */
  /* background: linear-gradient(to right, #ff7e5f, #feb47b); */
  padding: 20px;
  min-height: 100vh; /* 确保容器至少有视口高度 */
}

.套餐-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px; /* 网格间距 */
}

.owned-badge {
  background-color: rgba(40, 167, 69, 0.2); /* 已拥有标记的背景也带些透明 */
  color: #155724; /* 深绿色文字 */
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
  margin-left: 5px;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.no-permissions {
  color: #777;
  font-style: italic;
}

.套餐-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.套餐-card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.套餐-card h4 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 10px;
}

.套餐-description {
  font-size: 0.9em;
  color: #666;
  flex-grow: 1;
  margin-bottom: 15px;
}

.套餐-permissions-list li {
  background-color: #f8f9fa;
  border-color: #e9ecef;
}

.套餐-price {
  font-weight: bold;
  color: #28a745;
  margin-top: 10px;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.purchase-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  align-self: flex-start; /* 按钮在卡片底部左对齐 */
}

.purchase-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.purchase-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-button {
  background-color: #6c757d;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.action-button:hover {
  background-color: #545b62;
}

/* Modal Styles */
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
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 450px;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
  font-size: 0.9em;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.submit-button,
.cancel-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.submit-button {
  background-color: #28a745;
  color: white;
}

.submit-button:hover {
  background-color: #1e7e34;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
}

.cancel-button:hover {
  background-color: #545b62;
}
.permissions-section {
  background-color: #f9f9f9; /* 浅灰色背景 */
  border-radius: 8px; /* 圆角 */
  padding: 20px;
  margin-top: 20px; /* 与上方元素的间距 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* 更柔和的阴影 */
}

.permissions-section h3 {
  color: #333; /* 深色标题 */
  margin-bottom: 15px;
  font-size: 1.3em;
  border-bottom: 2px solid #eee; /* 标题下划线 */
  padding-bottom: 10px;
}

.current-permissions h4 {
  color: #555; /* 次级标题颜色 */
  margin-bottom: 10px;
  font-size: 1.1em;
}

.permissions-list.purchased {
  list-style-type: none; /* 移除默认列表样式 */
  padding-left: 0;
  display: flex; /* 使用 Flexbox 布局 */
  flex-wrap: wrap; /* 允许换行 */
  gap: 10px; /* 权限项之间的间距 */
}

.permission-item {
  background-color: #e0eafc; /* 淡蓝色背景 */
  color: #3a6ea5; /* 深蓝色文字 */
  padding: 8px 15px;
  border-radius: 20px; /* 胶囊形状 */
  font-size: 0.9em;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease-in-out;
}

.permission-item:hover {
  transform: translateY(-2px); /* 轻微上浮效果 */
  background-color: #cadcff; /* 悬停时颜色加深 */
}

.no-permissions {
  color: #777; /* 提示文字颜色 */
  font-style: italic;
  padding: 15px;
  background-color: #fff9e6; /* 淡黄色背景 */
  border-left: 4px solid #ffcc80; /* 左侧强调边框 */
  border-radius: 4px;
}
</style>
