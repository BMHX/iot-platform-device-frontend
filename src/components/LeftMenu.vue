<template>
  <div class="left">
    <template v-for="menuItem in filteredMenuItems" :key="menuItem.id">
      <div v-if="menuItem.isTopLevel && !menuItem.children" class="menu-item-wrapper">
        <router-link :to="menuItem.path" class="menu-item top-level">
          {{ menuItem.name }}
        </router-link>
      </div>
      <div v-else-if="menuItem.isTopLevel && menuItem.children && menuItem.children.length > 0" class="menu-group">
        <div class="menu-item top-level" @click="toggleSubMenu(menuItem.id)">
          {{ menuItem.name }}
          <span class="arrow" :class="{ 'expanded': openSubMenus[menuItem.id] }">&#9660;</span>
        </div>
        <div v-if="openSubMenus[menuItem.id]" class="sub-menu">
          <router-link v-for="subItem in menuItem.children" :key="subItem.id" :to="subItem.path" class="menu-item sub-item">
            {{ subItem.name }}
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { allMenuItems } from '@/config/menuConfig';

const openSubMenus = ref({});
const userPermissions = ref([]);

// 在组件挂载时从 localStorage 获取用户权限
onMounted(() => {
  const storedPermissions = localStorage.getItem('userPermissions');
  if (storedPermissions) {
    userPermissions.value = JSON.parse(storedPermissions);
  }
  // 初始化二级菜单的展开状态
  allMenuItems.forEach(item => {
    if (item.children && item.children.length > 0) {
      openSubMenus.value[item.id] = false; // 默认不展开
    }
  });
});

const filteredMenuItems = computed(() => {
  return allMenuItems.filter(item => {
    // 如果菜单项没有定义 requiredPermission，则默认显示
    if (!item.requiredPermission) {
      return true;
    }
    // 检查用户是否拥有该菜单项所需的权限
    const hasPermission = userPermissions.value.includes(item.requiredPermission);

    // 如果是一级菜单且有子菜单，需要进一步判断子菜单是否有可显示的
    if (item.children && item.children.length > 0) {
      const visibleChildren = item.children.filter(child => {
        if (!child.requiredPermission) return true;
        return userPermissions.value.includes(child.requiredPermission);
      });
      // 如果父菜单本身需要权限但用户没有，或者没有任何可见的子菜单，则不显示父菜单
      if (!hasPermission && item.requiredPermission) return false; // 父菜单自身权限检查
      return visibleChildren.length > 0; // 如果父菜单可见，则看是否有可见子菜单
    }
    return hasPermission;
  }).map(item => {
    // 如果菜单项有子菜单，同样过滤子菜单
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: item.children.filter(child => {
          if (!child.requiredPermission) return true;
          return userPermissions.value.includes(child.requiredPermission);
        })
      };
    }
    return item;
  });
});

const toggleSubMenu = (menuId) => {
  openSubMenus.value[menuId] = !openSubMenus.value[menuId];
};

</script>

<style lang="scss" scoped>
.left {
  width: 200px;
  background: #f5f7fa;
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  overflow-y: auto; // 如果菜单项过多，允许滚动
}

.menu-item-wrapper, .menu-group {
  margin-bottom: 5px;
}

.menu-item {
  display: block;
  padding: 10px 15px;
  border-radius: 4px;
  color: #333;
  text-decoration: none;
  transition: background-color 0.3s, color 0.3s;
  cursor: pointer;
}

.menu-item.top-level {
  font-weight: bold;
  position: relative;
}

.menu-item:hover {
  background: #e5e7eb;
}

.menu-item.router-link-exact-active,
.menu-item.sub-item.router-link-exact-active {
  background: #007bff;
  color: white;
}

.sub-menu {
  padding-left: 15px;
  max-height: 500px; 
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}

.menu-item.sub-item {
  font-size: 0.9em;
  padding: 8px 15px;
  margin-left: 10px; // 子菜单项的额外缩进
}

.arrow {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  transition: transform 0.3s ease-in-out;
}

.arrow.expanded {
  transform: translateY(-50%) rotate(180deg);
}
</style>
