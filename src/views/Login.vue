<template>
  <div class="login-container">
    <div class="login-form">
      <h2>{{ isRegisterMode ? "创建账户" : "系统登录" }}</h2>
      <form @submit.prevent="isRegisterMode ? handleRegister() : handleLogin()">
        <div class="form-group">
          <label for="username">用户名</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <div v-if="isRegisterMode" class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        <button type="submit" class="login-button" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          {{
            isLoading
              ? isRegisterMode
                ? "注册中..."
                : "登录中..."
              : isRegisterMode
              ? "注册"
              : "登录"
          }}
        </button>
      </form>
      <div class="toggle-mode">
        <a href="#" @click.prevent="toggleMode">
          {{ isRegisterMode ? "已有账户？去登录" : "没有账户？去注册" }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LoginView",
  data() {
    return {
      username: "",
      password: "",
      confirmPassword: "",
      error: "",
      successMessage: "",
      isLoading: false,
      isRegisterMode: false,
    };
  },
  methods: {
    async handleLogin() {
      // 改为异步函数
      this.isLoading = true;
      this.error = "";
      this.successMessage = "";

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userId", data.userId); // 假设后端返回 userId
          localStorage.setItem("username", data.username); // 假设后端返回 username
          localStorage.setItem(
            "userPermissions",
            JSON.stringify(data.permissions || [])
          ); // 假设后端返回 permissions
          // 实际项目中可能会返回 token，并存储 token
          // localStorage.setItem("token", data.token);
          this.$router.push("/dashboard");
        } else {
          this.error = data.message || "登录失败，请检查您的凭据";
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("userId");
          localStorage.removeItem("username");
          localStorage.removeItem("userPermissions");
          // localStorage.removeItem("token");
        }
      } catch (err) {
        this.error = "登录请求失败，请稍后再试或检查网络连接";
        console.error("Login error:", err);
      }
      this.isLoading = false;
    },
    async handleRegister() {
      // 改为异步函数
      this.isLoading = true;
      this.error = ""; // 确保每次注册前清空之前的错误信息
      this.successMessage = "";

      if (this.password !== this.confirmPassword) {
        this.error = "两次输入的密码不一致";
        this.isLoading = false;
        return;
      }

      try {
        const response = await fetch("/lh-cloud-wl/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password,
            identity: "user",
            permissionId: 1,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // this.errorMessage = data.message || "Registration failed. Please try again."; // 修改这里
          this.error = data.message || "Registration failed. Please try again."; // 改为 this.error
          throw new Error(
            data.message || `HTTP error! status: ${response.status}`
          );
        }

        this.successMessage =
          data.message || "Registration successful! You can now log in.";
        this.isRegisterMode = false; // 注册成功后切换回登录模式
        this.username = ""; // 清空表单
        this.password = "";
        this.confirmPassword = "";
      } catch (err) {
        console.error("Registration error:", err);
        // if (!this.errorMessage) { // 修改这里
        //   this.errorMessage = "An unexpected error occurred during registration."; // 修改这里
        // }
        if (!this.error) {
          // 改为 this.error
          this.error = "An unexpected error occurred during registration."; // 改为 this.error
        }
      }
      this.isLoading = false;
    },
    toggleMode() {
      this.isRegisterMode = !this.isRegisterMode;
      this.error = "";
      this.successMessage = "";
      this.username = "";
      this.password = "";
      this.confirmPassword = "";
    },
  },
  created() {
    // 检查本地是否有认证信息，如果有并且有效，则直接跳转到dashboard
    // 实际应用中，这里可能还需要验证token的有效性
    if (localStorage.getItem("isAuthenticated") === "true") {
      this.$router.push("/dashboard");
    }
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: cover;
  position: relative;
}

.login-container::before {
  content: "";
  position: absolute;
  top: -50px;
  left: -50px;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  filter: blur(10px);
  opacity: 0.5;
}

.login-container::after {
  content: "";
  position: absolute;
  bottom: -80px;
  right: -80px;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 45% 55% 70% 30% / 30% 50% 50% 70%;
  filter: blur(15px);
  opacity: 0.6;
  transform: rotate(15deg);
}

.login-form {
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  width: 100%;
  max-width: 420px;
  text-align: center;
  z-index: 1;
}

.login-form h2 {
  margin-bottom: 28px;
  color: #1f2937;
  font-size: 28px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 22px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #4b5563;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
  background-color: #f9fafb;
  color: #1f2937;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
  outline: none;
}

.login-button[disabled] {
  background-color: #9ca3af;
  cursor: not-allowed;
}
.login-button {
  width: 100%;
  padding: 14px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 17px;
  font-weight: 500;
  transition: background-color 0.3s ease, transform 0.1s ease;
  position: relative;
}

.login-button:hover:not([disabled]) {
  background-color: #2563eb;
}

.login-button:active:not([disabled]) {
  transform: scale(0.98);
}

.error-message {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9em;
}

.spinner {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-left-color: #fff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  display: inline-block;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toggle-mode {
  margin-top: 20px;
  font-size: 0.9em;
}

.toggle-mode a {
  color: #3b82f6;
  text-decoration: none;
}

.toggle-mode a:hover {
  text-decoration: underline;
}

.success-message {
  color: #10b981; /* Green for success */
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9em;
}
</style>
