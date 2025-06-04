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
        <el-menu-item index="/news">
          <el-icon><Message /></el-icon>
          <template #title>消息中心</template>
        </el-menu-item>
        <el-menu-item index="/admin">
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
                <el-dropdown-item @click="$router.push('/admin')">个人信息</el-dropdown-item>
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
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Document, Link } from '@element-plus/icons-vue';

export default {
  components: {
    Document,
    Link
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    
    // 当前激活的菜单
    const activeMenu = computed(() => {
      return route.path;
    });
    
    // 用户名
    const username = ref(localStorage.getItem('username') || '用户');
    
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
    const logout = () => {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userPermissions');
      localStorage.removeItem('username');
      router.push('/login');
    };
    
    // 初始化侧边栏状态
    initSidebarStatus();
    
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
