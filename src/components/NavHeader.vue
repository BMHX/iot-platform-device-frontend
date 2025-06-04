<template>
  <div class="nav">
    <div class="nav-left">
      <img :src="logo" alt="平台Logo" class="logo" />
      <span class="welcome">欢迎回来, {{ username }}</span>
    </div>
    <div class="nav-center">
      <input
        type="text"
        class="search-input"
        placeholder="搜索平台内容..."
        v-model="searchQuery"
        @keyup.enter="handleSearch"
      />
    </div>
    <div class="nav-right">
      <router-link to="/news" class="notification-icon-link">
        <i class="notification-icon">🔔</i>
        <span v-if="unreadMessages > 0" class="notification-badge-custom">{{
          unreadMessages
        }}</span>
      </router-link>
      <div class="quick-entries">
        <router-link to="/statistics" class="icon">📊</router-link>
        <router-link to="/alarm" class="icon">📝</router-link>
        <router-link to="/device" class="icon">🔧</router-link>
      </div>
      <div class="user-info" @click="toggleUserMenu" ref="userInfo">
        <img src="../assets/1.png" alt="用户头像" class="avatar" />
        <div
          v-if="isUserMenuOpen"
          class="user-dropdown-menu-custom"
          ref="userMenu"
        >
          <a href="#" @click.prevent="navigateTo('/admin')">个人中心</a>
          <!-- <a href="#" @click.prevent="navigateTo('/settings')">设置</a> --> <!-- 移除设置 -->
          <a href="#" @click.prevent="logout">退出登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import logo from "../assets/logo.svg";

export default {
  name: "NavHeader", // 添加 name 属性
  data() {
    return {
      logo,
      username: "管理员", // 示例用户名
      searchQuery: "",
      isUserMenuOpen: false,
      unreadMessages: 3, // 示例未读消息数量
    };
  },
  methods: {
    handleSearch() {
      if (this.searchQuery.trim() !== "") {
        console.log("Searching for:", this.searchQuery);
        // 实际搜索逻辑，例如路由跳转或API调用
        // this.$router.push({ path: '/search', query: { q: this.searchQuery } });
        this.searchQuery = ""; // 清空搜索框
      }
    },
    toggleUserMenu() {
      this.isUserMenuOpen = !this.isUserMenuOpen;
    },
    logout() {
      console.log("User logged out");
      this.isUserMenuOpen = false;
      // 清除登录状态
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userPermissions');
      // 跳转到登录页
      this.$router.push('/login');
    },
    navigateTo(path) {
      this.isUserMenuOpen = false;
      // 确保在跳转前用户是登录状态，或者目标路径是公共的
      // 这里的逻辑可以根据需要调整，但通常路由守卫会处理未授权访问
      if (path === '/admin' && localStorage.getItem('isAuthenticated') !== 'true') {
          this.$router.push('/login');
      } else {
          this.$router.push(path);
      }
    },
    handleClickOutside(event) {
      // 检查点击是否在用户信息区域或用户菜单之外
      if (
        this.$refs.userInfo &&
        !this.$refs.userInfo.contains(event.target) &&
        this.$refs.userMenu &&
        !this.$refs.userMenu.contains(event.target)
      ) {
        this.isUserMenuOpen = false;
      }
    },
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  },
};
</script>

<style lang="scss" scoped>
@use "../assets/navHeaderStyles.scss";
</style>
