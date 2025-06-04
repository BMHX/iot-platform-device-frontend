import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import Admin from "../views/Admin.vue";
import Device from "../views/Device.vue";
import Connect from "../views/Connect.vue";
import Alarm from "../views/Alarm.vue";
import Statistics from "../views/Statistics.vue";
import News from "../views/News.vue";
import LoginView from "../views/Login.vue"; // 新增：导入登录组件

function getCurrentUserPermissions() {
  // 从 localStorage 获取权限
  const storedPermissions = localStorage.getItem("userPermissions");
  return storedPermissions ? JSON.parse(storedPermissions) : [];
}

const routes = [
  {
    path: "/login", // 新增：登录页路由
    name: "Login",
    component: LoginView,
    meta: { requiresAuth: false }, // 登录页不需要认证
  },
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true }, // 修改：大屏现在需要认证
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
    meta: { requiresAuth: true, permissionId: "admin" }, // 修改：个人中心需要认证
  },
  {
    path: "/device",
    name: "Device",
    component: Device,
    meta: { requiresAuth: true, permissionId: "device" }, // 修改：设备管理需要认证
  },
  {
    path: "/connect",
    name: "Connect",
    component: Connect,
    meta: { requiresAuth: true, permissionId: "connect" }, // 修改：设备对接需要认证
  },
  {
    path: "/alarm",
    name: "Alarm",
    component: Alarm,
    meta: { requiresAuth: true, permissionId: "alarm" }, // 修改：告警管理需要认证
  },
  {
    path: "/statistics",
    name: "Statistics",
    component: Statistics,
    meta: { requiresAuth: true, permissionId: "statistics" }, // 统计分析需要权限
  },
  {
    path: "/news",
    name: "News",
    component: News,
    meta: { requiresAuth: true, permissionId: "news" }, // 消息中心需要权限
  },
  // 您可以添加一个统一的无权限页面路由
  // {
  //   path: '/no-permission',
  //   name: 'NoPermission',
  //   component: NoPermission
  // }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userPermissions = getCurrentUserPermissions();
  const routeRequiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth
  );
  const requiredPermissionId = to.meta.permissionId;

  if (routeRequiresAuth && !isAuthenticated) {
    // 如果路由需要认证但用户未登录，则重定向到登录页
    next({ name: "Login" });
    return;
  }

  if (!routeRequiresAuth && isAuthenticated && to.name === "Login") {
    // 如果用户已登录且尝试访问登录页，则重定向到首页
    next({ name: "Dashboard" });
    return;
  }

  // 对于需要特定权限的已认证路由
  if (routeRequiresAuth && isAuthenticated) {
    if (requiredPermissionId) {
      if (userPermissions.includes(requiredPermissionId)) {
        to.meta.hasPermission = true;
      } else {
        to.meta.hasPermission = false;
        // 如果没有权限，可以选择停留在当前页（组件内部处理显示），
        // 或者重定向到统一的无权限页，或者首页
        // 此处我们让组件自行处理 hasPermission 为 false 的情况
      }
    } else {
      // 如果路由需要认证但没有指定 permissionId (例如 Dashboard)，则认为有权限访问
      to.meta.hasPermission = true;
    }
    next();
    return;
  }

  // 对于不需要认证的页面 (例如登录页本身，如果requiresAuth为false)
  // 或者其他未覆盖的情况，直接放行
  to.meta.hasPermission = true; // 默认公共页面有权限
  next();
});

export default router;
