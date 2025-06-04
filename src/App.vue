<template>
  <div :class="containerClass">
    <NavHeader v-if="showLayout" />
    <div :class="contentWrapperClass">
      <LeftMenu v-if="showLayout" />
      <MainContent />
    </div>
  </div>
</template>

<script>
import NavHeader from "./components/NavHeader.vue";
import LeftMenu from "./components/LeftMenu.vue";
import MainContent from "./components/MainContent.vue";

export default {
  components: {
    NavHeader,
    LeftMenu,
    MainContent,
  },
  computed: {
    showLayout() {
      // 如果当前路由是登录页，则不显示布局组件
      return this.$route.name !== 'Login';
    },
    containerClass() {
      // 根据是否显示布局组件，应用不同的顶层容器样式
      return this.showLayout ? 'container-with-layout' : 'container-full-page';
    },
    contentWrapperClass() {
      // 根据是否显示布局组件，应用不同的内容区域包裹样式
      return this.showLayout ? 'content-with-layout' : 'content-full-page';
    }
  },
};
</script>

<style lang="scss" scoped>
.container-with-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-with-layout {
  flex: 1;
  display: flex;
}

/* 当不显示布局（如登录页）时，让 MainContent 占据整个页面 */
.container-full-page {
  min-height: 100vh;
  display: flex; /* 使内部的 MainContent 可以撑满 */
  flex-direction: column; /* 确保 MainContent 垂直排列 */
}

.content-full-page {
  flex: 1; /* 确保 MainContent 占据所有可用空间 */
  display: flex; /* 如果 MainContent 内部也需要 flex 布局 */
}

/* 原有的 .left 和 .right 样式可以保留，因为它们只在 LeftMenu 和 MainContent 实际渲染时起作用 */
.left {
  width: 200px;
  background: #f8f9fa;
  padding: 20px 0;
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.1);
}

.right {
  flex: 1;
  background: #fff;
  padding: 20px;
}
</style>
