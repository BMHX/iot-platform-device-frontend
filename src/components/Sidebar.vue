<template>
  <el-menu
    :default-active="activeMenu"
    class="sidebar-menu"
    :collapse="isCollapse"
    router
  >
    <el-menu-item index="/dashboard">
      <el-icon><HomeFilled /></el-icon>
      <template #title>首页</template>
    </el-menu-item>

    <el-menu-item index="/device">
      <el-icon><Monitor /></el-icon>
      <template #title>设备管理</template>
    </el-menu-item>

    <el-menu-item index="/connect">
      <el-icon><Connection /></el-icon>
      <template #title>连接管理</template>
    </el-menu-item>

    <el-menu-item index="/protocol">
      <el-icon><Document /></el-icon>
      <template #title>协议管理</template>
    </el-menu-item>

    <el-menu-item index="/device-protocol">
      <el-icon><Setting /></el-icon>
      <template #title>设备协议</template>
    </el-menu-item>

    <el-menu-item index="/device-stats">
      <el-icon><DataLine /></el-icon>
      <template #title>设备消息管理</template>
    </el-menu-item>

    <el-menu-item index="/alarm">
      <el-icon><Bell /></el-icon>
      <template #title>告警管理</template>
    </el-menu-item>

    <el-menu-item index="/statistics">
      <el-icon><TrendCharts /></el-icon>
      <template #title>统计分析</template>
    </el-menu-item>

    <el-menu-item index="/news">
      <el-icon><Message /></el-icon>
      <template #title>消息中心</template>
    </el-menu-item>

    <el-menu-item index="/admin/profile">
      <el-icon><User /></el-icon>
      <template #title>个人中心</template>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeFilled,
  Monitor,
  Connection,
  Document,
  Setting,
  DataLine,
  Bell,
  TrendCharts,
  Message,
  User
} from '@element-plus/icons-vue'

const route = useRoute()
const isCollapse = ref(false)

const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  border-right: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 200px;
}

.el-menu-item {
  display: flex;
  align-items: center;
}

.el-icon {
  margin-right: 8px;
}
</style> 