<template>
  <!-- 登录页面不显示布局 -->
  <div v-if="$route.name === 'Login'" class="login-container">
    <router-view />
  </div>
  
  <!-- 主应用布局 -->
  <el-container v-else class="layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
        <h2 v-if="!isCollapse">物联网平台</h2>
        <h2 v-else>IoT</h2>
      </div>
      <el-menu
        router
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :collapse="isCollapse"
        :collapse-transition="false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/device">
          <el-icon><Cpu /></el-icon>
          <template #title>设备管理</template>
        </el-menu-item>
        <el-menu-item index="/device-message">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>设备消息管理</template>
        </el-menu-item>
        <el-menu-item index="/connect">
          <el-icon><Connection /></el-icon>
          <template #title>设备对接</template>
        </el-menu-item>
        <el-menu-item index="/protocol">
          <el-icon><Document /></el-icon>
          <template #title>协议管理</template>
        </el-menu-item>
        <el-menu-item index="/device-protocol">
          <el-icon><Link /></el-icon>
          <template #title>设备协议绑定</template>
        </el-menu-item>
        <el-menu-item index="/alarm">
          <el-icon><Bell /></el-icon>
          <template #title>告警管理</template>
        </el-menu-item>
        <el-menu-item index="/statistics">
          <el-icon><PieChart /></el-icon>
          <template #title>统计分析</template>
        </el-menu-item>
        <el-sub-menu index="/news">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>资讯管理</span>
          </template>
        <el-menu-item index="/news">
            <el-icon><Document /></el-icon>
            <template #title>新闻管理</template>
          </el-menu-item>
          <el-menu-item index="/news-source">
            <el-icon><Collection /></el-icon>
            <template #title>来源管理</template>
        </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/admin/profile">
          <el-icon><User /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon :size="20" @click="toggleSidebar">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              {{ username }} <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/admin/profile')">个人信息</el-dropdown-item>
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Document, Link, User, ChatDotRound, Collection } from '@element-plus/icons-vue';
import axios from 'axios';
import { useUserStore } from '@/stores/user'

export default {
  components: {
    Document,
    Link,
    User,
    ChatDotRound,
    Collection
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const userStore = useUserStore();
    
    // 当前激活的菜单
    const activeMenu = computed(() => {
      return route.path;
    });
    
    // 用户名
    const username = computed(() => userStore.username);
    
    // 侧边栏折叠状态
    const isCollapse = ref(false);
    const toggleSidebar = () => {
      isCollapse.value = !isCollapse.value;
      localStorage.setItem('sidebarStatus', isCollapse.value ? '1' : '0');
    };
    
    // 从本地存储中恢复侧边栏状态
    const initSidebarStatus = () => {
      const sidebarStatus = localStorage.getItem('sidebarStatus');
      if (sidebarStatus) {
        isCollapse.value = sidebarStatus === '1';
      }
    };
    
    // 退出登录
    const logout = async () => {
      try {
        // 清除用户信息
        userStore.clearUserInfo();
        // 清除所有本地存储
        localStorage.removeItem('adminId');
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userPermissions');
        localStorage.removeItem('sidebarStatus');
        
        // 确保路由跳转完成
        await router.replace('/login');
      } catch (error) {
        console.error('退出登录失败:', error);
      }
    };

    // 更新最后登录时间
    const updateLastLoginTime = async () => {
      const adminId = userStore.adminId;
      if (adminId) {
        try {
          await axios.put(`/api/admin/last-login/${adminId}`);
        } catch (error) {
          console.error('更新最后登录时间失败:', error);
        }
      }
    };
    
    // 初始化
    onMounted(() => {
      initSidebarStatus();
      updateLastLoginTime();
    });
    
    return {
      activeMenu,
      username,
      isCollapse,
      toggleSidebar,
      logout
    };
  }
};
</script>

<style lang="scss" scoped>
.layout {
  height: 100vh;
}

.login-container {
  height: 100vh;
}

.aside {
  background-color: #304156;
  color: #fff;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  overflow: hidden;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}

.header-left {
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-x: auto;
}

/* 折叠菜单样式优化 */
:deep(.el-menu--collapse) {
  width: 64px;
}

:deep(.el-menu--collapse .el-menu-item) {
  text-align: center;
}
</style>
