import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import Admin from "../views/Admin.vue";
import Device from "../views/Device.vue";
import Connect from "../views/Connect.vue";
import Protocol from "../views/Protocol.vue";
import DeviceProtocol from "../views/DeviceProtocol.vue";
import Alarm from "../views/Alarm.vue";
import Statistics from "../views/Statistics.vue";
import News from "../views/News.vue";
import LoginView from "../views/Login.vue"; // 新增：导入登录组件
import AdminProfile from '../views/AdminProfile.vue'
import DeviceMessage from '../views/DeviceMessage.vue'

function getCurrentUserPermissions() {
  // 从 localStorage 获取权限
  const storedPermissions = localStorage.getItem("userPermissions");
  return storedPermissions ? JSON.parse(storedPermissions) : [];
}

const routes = [
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin/profile",
    name: "AdminProfile",
    component: AdminProfile,
    meta: { requiresAuth: true },
  },
  {
    path: "/device",
    name: "Device",
    component: Device,
    meta: { requiresAuth: true },
  },
  {
    path: "/connect",
    name: "Connect",
    component: Connect,
    meta: { requiresAuth: true },
  },
  {
    path: "/protocol",
    name: "Protocol",
    component: Protocol,
    meta: { requiresAuth: true },
  },
  {
    path: "/device-protocol",
    name: "DeviceProtocol",
    component: DeviceProtocol,
    meta: { requiresAuth: true },
  },
  {
    path: "/alarm",
    name: "Alarm",
    component: Alarm,
    meta: { requiresAuth: true },
  },
  {
    path: "/statistics",
    name: "Statistics",
    component: Statistics,
    meta: { requiresAuth: true },
  },
  {
    path: "/news",
    name: "News",
    component: News,
    meta: { requiresAuth: true },
  },
  {
    path: "/device-message",
    name: "DeviceMessage",
    component: DeviceMessage,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 需要认证但未登录，重定向到登录页
    next({ name: "Login" });
  } else if (!to.meta.requiresAuth && isAuthenticated && to.name === "Login") {
    // 已登录但访问登录页，重定向到首页
    next({ name: "Dashboard" });
  } else {
    // 其他情况直接放行
    next();
  }
});

export default router;
