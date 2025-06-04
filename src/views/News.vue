<template>
  <div class="news-page news-page-styles">
    <!-- Add news-page-styles class here -->
    <div v-if="hasPermission">
      <header class="news-header">
        <h1>消息中心</h1>
        <div class="filters">
          <select v-model="selectedCategory" class="filter-select">
            <option value="all">全部分类</option>
            <option value="system">系统通知</option>
            <option value="product">产品更新</option>
            <option value="event">活动资讯</option>
          </select>
          <select v-model="sortBy" class="filter-select">
            <option value="date_desc">最新发布</option>
            <option value="date_asc">最早发布</option>
            <option value="unread">未读优先</option>
            <!-- 假设有未读状态 -->
          </select>
        </div>
      </header>

      <div class="news-list">
        <div v-if="filteredNews.length === 0" class="no-news">
          <p>暂无消息</p>
        </div>
        <div
          v-for="item in filteredNews"
          :key="item.id"
          class="news-card"
          :class="{ unread: item.isUnread }"
        >
          <div class="card-header">
            <h3 class="news-title">{{ item.title }}</h3>
            <span class="news-date">{{ formatDate(item.date) }}</span>
          </div>
          <p class="news-summary">{{ item.summary }}</p>
          <div class="card-footer">
            <span class="news-category"
              >分类: {{ getCategoryName(item.category) }}</span
            >
            <button @click="viewDetails(item)" class="btn-view-details">
              查看详情
            </button>
          </div>
          <span v-if="item.isUnread" class="unread-badge">未读</span>
        </div>
      </div>

      <!-- 消息详情弹窗 (简易) -->
      <div v-if="selectedNewsItem" class="modal-overlay">
        <div class="modal-content news-detail-modal">
          <h2>{{ selectedNewsItem.title }}</h2>
          <p class="detail-date">
            发布于: {{ formatDate(selectedNewsItem.date) }}
          </p>
          <hr />
          <div
            class="detail-content"
            v-html="selectedNewsItem.fullContent"
          ></div>
          <div class="modal-actions">
            <button @click="closeDetailsModal" class="btn btn-secondary">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- <<<< 这里是添加的结束标签 >>>> -->
    <div v-else class="no-permission-message">
      <p>您没有权限查看消息中心，请升级您的套餐或联系管理员。</p>
      <!-- 可以添加一个升级按钮 -->
      <!-- <button @click="goToUpgradePage">升级套餐</button> -->
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isLoading: false, // 新增加载状态
      selectedCategory: "all",
      sortBy: "date_desc",
      newsItems: [], // 初始化为空数组
      selectedNewsItem: null,
      hasPermission: true, // 新增权限状态，默认为true，实际应从用户状态管理获取
    };
  },
  computed: {
    filteredNews() {
      let items = [...this.newsItems];
      // 分类过滤
      if (this.selectedCategory !== "all") {
        items = items.filter((item) => item.category === this.selectedCategory);
      }
      // 排序
      if (this.sortBy === "date_desc") {
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      if (this.sortBy === "date_asc") {
        items.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      if (this.sortBy === "unread") {
        items.sort(
          (a, b) =>
            (b.isUnread ? 1 : 0) - (a.isUnread ? 1 : 0) ||
            new Date(b.date) - new Date(a.date)
        );
      }
      return items;
    },
  },
  methods: {
    checkUserPermission() {
      // 在实际应用中，这里会检查用户的真实权限
      // 例如，从 localStorage 或者 Vuex store 中获取用户信息和权限等级
      const userPermissions =
        JSON.parse(localStorage.getItem("userPermissions")) || {};
      // 假设需要 'view_news' 权限才能查看消息中心
      // this.hasPermission = userPermissions.includes('view_news');
      // 为了演示，我们暂时硬编码为 false，模拟无权限的情况
      // 在实际场景中，您应该根据登录用户的实际权限来设置这个值
      // 例如，如果用户是普通用户，则设置为 false
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && user.role === "user") {
        // 假设普通用户 'user' 没有权限
        this.hasPermission = false;
      } else {
        this.hasPermission = true; // 其他角色（如 'admin'）有权限
      }
    },
    async fetchNewsItems() {
      if (!this.hasPermission) return; // 如果没有权限，则不加载数据
      this.isLoading = true;
      console.log("调用后端API: 获取消息列表");
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // const response = await fetch(`/api/news?category=${this.selectedCategory}&sortBy=${this.sortBy}`);
      // const data = await response.json();
      // this.newsItems = data;
      this.newsItems = [
        {
          id: 1,
          title: "系统维护通知 (来自API)",
          date: "2024-05-28T10:00:00Z",
          summary: "API数据：我们将于2024年6月1凌晨进行系统维护...",
          fullContent: "<p>API数据：详细的系统维护内容...</p>",
          category: "system",
          isUnread: true,
        },
        {
          id: 2,
          title: "新功能：智能报表 (来自API)",
          date: "2024-05-27T15:30:00Z",
          summary: "API数据：智能报表分析功能现已正式上线...",
          fullContent: "<p>API数据：详细的新功能介绍...</p>",
          category: "product",
          isUnread: false,
        },
      ];
      this.isLoading = false;
    },
    formatDate(dateString) {
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },
    getCategoryName(categoryKey) {
      const names = {
        system: "系统通知",
        product: "产品更新",
        event: "活动资讯",
      };
      return names[categoryKey] || "其他";
    },
    async viewDetails(item) {
      // 改为异步，可能需要从后端获取完整内容
      this.isLoading = true;
      console.log("调用后端API: 获取消息详情", item.id);
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      // const response = await fetch(`/api/news/${item.id}`);
      // const fullItemData = await response.json();
      // this.selectedNewsItem = fullItemData;
      // // 标记为已读 (如果后端处理，则不需要前端模拟)
      // if (fullItemData.isUnread) {
      //    await fetch(`/api/news/${item.id}/read`, { method: 'POST' });
      //    const originalItem = this.newsItems.find((i) => i.id === item.id);
      //    if (originalItem) originalItem.isUnread = false;
      // }
      this.selectedNewsItem = {
        ...item,
        fullContent: item.fullContent || "<p>从API加载的完整内容...</p>",
      }; // 使用已有或模拟的完整内容
      const originalItem = this.newsItems.find((i) => i.id === item.id);
      if (originalItem && originalItem.isUnread) {
        originalItem.isUnread = false; // 前端模拟标记已读
        // 可以在这里加一个调用后端标记已读的API
      }
      this.isLoading = false;
    },
    closeDetailsModal() {
      this.selectedNewsItem = null;
    },
  },
  watch: {
    selectedCategory() {
      if (this.hasPermission) {
        this.fetchNewsItems(); // 筛选条件变化时重新获取数据
      }
    },
    sortBy() {
      if (this.hasPermission) {
        this.fetchNewsItems(); // 排序条件变化时重新获取数据
      }
    },
  },
  mounted() {
    this.checkUserPermission(); // 组件挂载后检查用户权限
    if (this.hasPermission) {
      this.fetchNewsItems(); // 组件挂载后获取数据
    }
  },
};
</script>

<style lang="scss">
@use "@/assets/navHeaderStyles.scss"; // Or @import, if @use is not configured

.no-permission-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 200px); /* Adjust height as needed */
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
  color: #555;
}

.no-permission-message p {
  margin-bottom: 20px;
}

/* 可以在这里添加升级按钮的样式 */
/*
.no-permission-message button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.no-permission-message button:hover {
  background-color: #0056b3;
}
*/
</style>
