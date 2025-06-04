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
      userId: localStorage.getItem('userId') || "", // 在 data 中初始化 userId
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
  async created() {
    const token = localStorage.getItem("token");
    // this.userId 应该已经在 data 中通过 localStorage.getItem('userId') 初始化了
    // 如果 localStorage 中没有 userId，this.userId 将是空字符串或 null

    if (!token) {
      alert("用户未登录或登录已过期，请重新登录。");
      this.$router.push({ name: "Login" });
      return;
    }

    // 在调用 fetchUserProfile 之前，再次确认 this.userId 是否有效
    if (!this.userId) {
      console.error("Error in created hook: User ID not found in localStorage.");
      alert("无法获取用户信息，用户ID未在本地存储中找到。请重新登录。");
      this.$router.push({ name: "Login" }); // 跳转到登录页
      return;
    }

    await this.fetchUserProfile();
    await this.fetchAvailablePackages();
  },
  methods: {
    async fetchUserProfile() {
      const token = localStorage.getItem("token");
      const currentUserId = this.userId; // 直接使用 data 中的 userId

      if (!token) {
        console.error("Error fetching user profile: Token not found.");
        alert("认证信息丢失，请重新登录。");
        this.$router.push({ name: "Login" });
        return;
      }

      // currentUserId 的检查移到 created 钩子中，确保在调用此方法前 userId 已有效
      // if (!currentUserId) { ... } // 这部分检查可以移到 created 钩子

      try {
        const response = await fetch(`/api/user/profile/${currentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          localStorage.removeItem("userId");
          alert("登录已过期或无效，请重新登录。");
          this.$router.push({ name: "Login" });
          throw new Error("无效的用户凭证或登录过期");
        }
        if (!response.ok) {
          let errorMsg = "获取用户信息失败";
          try {
            // 尝试解析后端返回的错误信息
            const errorData = await response.json(); 
            errorMsg = errorData.message || `服务器返回状态: ${response.status}`;
          } catch (e) {
            // 如果解析json失败，使用通用的错误信息
            errorMsg = `获取用户信息失败 (状态: ${response.status} ${response.statusText})`;
          }
          // 将详细错误信息抛出，以便在控制台和 alert 中显示
          throw new Error(errorMsg); 
        }
        const data = await response.json();
        this.userId = data.userId;
        this.username = data.username;
        this.userPermissions = Array.isArray(data.permissions)
          ? data.permissions.map(Number)
          : [];
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // 避免重复 alert，因为 created 钩子中可能已经 alert 过了
        if (!error.message.includes("无效的用户凭证") && !error.message.includes("登录过期")) {
            // 在 alert 中显示更具体的错误信息
            alert(error.message || "无法加载用户信息，请稍后再试。"); 
        }
      }
    },
    async fetchAvailablePackages() {
      try {
        const response = await fetch("/api/permissions/packages", { // 此接口地址不变
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("获取权限套餐失败");
        }
        const packagesData = await response.json();
        // 确保每个套餐的 permissions 字段是数字数组, 后端应直接返回数字数组
        this.availablePackages = Array.isArray(packagesData)
          ? packagesData.map((pkg) => ({
              ...pkg, // pkg 应包含 id, name, price
              permissions: Array.isArray(pkg.permissions)
                ? pkg.permissions.map(Number)
                : [],
            }))
          : [];
      } catch (error) {
        console.error("Error fetching packages:", error);
        alert(error.message || "无法加载权限套餐，请稍后再试。");
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

<style lang="scss" scoped>
.admin-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.user-profile-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.user-profile-card h2 {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.profile-details .detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.profile-details .detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-weight: bold;
  color: #555;
}

.detail-item .value {
  color: #333;
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
</style>
