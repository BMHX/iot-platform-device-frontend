<template>
  <div class="page-container">
    <el-card class="search-form">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索协议名称或编码..."
            prefix-icon="Search"
            clearable
            @clear="loadProtocols"
            @keyup.enter="searchProtocols"
          />
        </el-col>
        <el-col :span="8">
          <div>
            <span class="filter-label">状态：</span>
            <el-radio-group v-model="currentStatusFilter" size="large" @change="filterProtocols">
              <el-radio-button :label="null">全部</el-radio-button>
              <el-radio-button :label="1">启用</el-radio-button>
              <el-radio-button :label="0">禁用</el-radio-button>
            </el-radio-group>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="data-table">
      <div class="table-header">
        <div class="table-info">
          <el-tag type="info" v-if="filteredProtocolList.length > 0">
            共 {{ filteredProtocolList.length }} 条数据，当前显示 {{ getPaginationInfo() }}
          </el-tag>
          <el-tag type="info" v-else>暂无数据</el-tag>
        </div>
        <div class="table-actions">
          <el-radio-group v-model="pageSize" size="small" @change="handleSizeChange">
            <el-radio-button :label="5">5条/页</el-radio-button>
            <el-radio-button :label="10">10条/页</el-radio-button>
            <el-radio-button :label="15">15条/页</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-table
        v-loading="isLoading"
        :data="displayProtocolList"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="protocolName" label="协议名称" width="150" />
        <el-table-column prop="protocolCode" label="协议编码" width="150" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!isLoading && displayProtocolList.length === 0" class="no-data">
        <el-empty description="暂无协议数据" />
      </div>

      <!-- 分页控件 -->
      <div class="pagination-container" v-if="filteredProtocolList.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 15]"
          :pager-count="5"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredProtocolList.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ElMessage } from "element-plus";
import { getProtocolList } from "@/api/protocol";

export default {
  data() {
    return {
      isLoading: false,
      searchQuery: "",
      currentStatusFilter: null,
      protocolList: [], // 所有协议数据
      filteredProtocolList: [], // 过滤后的协议数据
      displayProtocolList: [], // 当前页显示的协议数据
      currentPage: 1,
      pageSize: parseInt(localStorage.getItem('pageSize') || '10')
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.filteredProtocolList.length / this.pageSize) || 1;
    }
  },
  methods: {
    formatDateTime(dateTime) {
      if (!dateTime) return '-';
      const date = new Date(dateTime);
      return date.toLocaleString();
    },
    
    async fetchProtocols() {
      this.isLoading = true;
      
      try {
        const result = await getProtocolList({});
        console.log('获取到的协议列表:', result);
        
        if (Array.isArray(result)) {
          // 直接是数组结构
          this.protocolList = result;
        } else if (result && result.data && Array.isArray(result.data)) {
          // 包含在data字段中
          this.protocolList = result.data;
        } else {
          // 其他格式，尝试处理
          this.protocolList = [];
          ElMessage.warning('协议数据格式不符合预期');
        }
        
        // 初始化分页
        this.currentPage = 1;
        this.applyFilters();
        this.updateDisplayList();
        
        ElMessage.success('成功获取协议列表');
      } catch (error) {
        console.error('获取协议列表失败:', error);
        
        this.protocolList = [];
        this.filteredProtocolList = [];
        this.displayProtocolList = [];
        
        let errorMsg = '获取协议列表失败';
        if (error.response) {
          errorMsg += `: ${error.response.status}`;
          console.log('完整错误响应:', error.response);
        }
        
        ElMessage.error(errorMsg);
      } finally {
        this.isLoading = false;
      }
    },
    
    // 本地加载所有协议（不发送请求）
    loadProtocols() {
      console.log("执行loadProtocols");
      this.currentPage = 1; // 重置到第一页
      this.applyFilters();
      this.updateDisplayList();
    },
    
    // 本地搜索协议
    searchProtocols() {
      if (!this.searchQuery.trim()) {
        this.loadProtocols();
        return;
      }
      
      this.currentPage = 1; // 重置到第一页
      this.applyFilters();
      this.updateDisplayList();
    },
    
    // 应用过滤条件
    applyFilters() {
      // 第一步：应用搜索过滤
      let filtered = [...this.protocolList];
      
      // 搜索过滤
      if (this.searchQuery.trim()) {
        const searchText = this.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(protocol => {
          return (
            (protocol.protocolName && protocol.protocolName.toLowerCase().includes(searchText)) ||
            (protocol.protocolCode && protocol.protocolCode.toLowerCase().includes(searchText))
          );
        });
      }
      
      // 状态过滤
      if (this.currentStatusFilter !== null) {
        filtered = filtered.filter(protocol => protocol.status === this.currentStatusFilter);
      }
      
      this.filteredProtocolList = filtered;
    },
    
    // 更新显示列表（分页）
    updateDisplayList() {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      
      console.log(`分页信息：当前页=${this.currentPage}, 每页=${this.pageSize}, 总数=${this.filteredProtocolList.length}`);
      console.log(`显示范围：${startIndex} 到 ${endIndex}`);
      
      this.displayProtocolList = this.filteredProtocolList.slice(startIndex, endIndex);
      
      console.log(`当前页数据数量: ${this.displayProtocolList.length}`);
    },
    
    // 本地过滤协议状态
    filterProtocols(resetPage = true) {
      if (resetPage) {
        this.currentPage = 1;
      }
      
      this.applyFilters();
      this.updateDisplayList();
    },

    handleSizeChange(newSize) {
      console.log(`改变每页显示数: ${newSize}`);
      this.pageSize = newSize;
      localStorage.setItem('pageSize', newSize.toString());
      this.currentPage = 1; // 重置到第一页
      this.updateDisplayList();
    },

    handleCurrentChange(newPage) {
      console.log(`切换到页码: ${newPage}`);
      this.currentPage = newPage;
      this.updateDisplayList();
    },

    getPaginationInfo() {
      const startIndex = (this.currentPage - 1) * this.pageSize + 1;
      const endIndex = Math.min(this.currentPage * this.pageSize, this.filteredProtocolList.length);
      return `第 ${startIndex} - ${endIndex} 条，共 ${this.filteredProtocolList.length} 条`;
    }
  },
  mounted() {
    // 从本地存储恢复分页设置
    const savedPageSize = localStorage.getItem('pageSize');
    if (savedPageSize) {
      this.pageSize = parseInt(savedPageSize);
    }
    
    console.log("组件挂载，初始页面大小:", this.pageSize);
    
    // 加载协议列表
    this.fetchProtocols();
  },
  watch: {
    // 监听过滤器变化，自动更新分页
    currentStatusFilter() {
      this.currentPage = 1; // 重置到第一页
      this.filterProtocols(false);
    },
    
    // 监听页面大小变化，自动更新显示
    pageSize() {
      this.updateDisplayList();
    },
    
    // 监听当前页变化，确保不超出范围
    currentPage(newPage) {
      console.log(`当前页变为: ${newPage}, 总页数: ${this.totalPages}`);
      // 确保当前页不超出总页数
      if (newPage > this.totalPages) {
        console.log(`页码越界，重置为: ${this.totalPages}`);
        this.$nextTick(() => {
          this.currentPage = this.totalPages;
        });
      }
    },
    
    // 监听筛选后的数据列表变化
    filteredProtocolList: {
      handler(newList) {
        console.log(`筛选后数据变化，数量: ${newList.length}`);
        // 当数据变化导致总页数减少，且当前页超出新的总页数范围时
        if (this.currentPage > this.totalPages) {
          console.log(`数据变化导致页码越界，重置为: ${this.totalPages}`);
          this.currentPage = this.totalPages;
        }
        this.updateDisplayList();
      },
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
.text-right {
  text-align: right;
}

.mb-20 {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.no-data {
  padding: 40px 0;
  text-align: center;
}

.data-table {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  padding: 10px 0;
  text-align: right;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

.el-pagination {
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: flex-end;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.table-info {
  margin-right: 20px;
}

.table-actions {
  margin-right: 20px;
}

.filter-label {
  margin-right: 10px;
}
</style> 