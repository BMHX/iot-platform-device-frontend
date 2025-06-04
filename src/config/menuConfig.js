// src/config/menuConfig.js
export const allMenuItems = [
  {
    id: 'admin',
    path: '/admin',
    name: '个人中心',
    isTopLevel: true
    // 基础页面，默认所有用户可见，无需 specific requiredPermission
  },
  {
    id: 'device',
    path: '/device',
    name: '设备管理',
    isTopLevel: true
  },
  {
    id: 'connect',
    path: '/connect',
    name: '设备对接',
    isTopLevel: true
  },
  {
    id: 'alarm',
    path: '/alarm',
    name: '告警管理',
    isTopLevel: true
  },
  {
    id: 'dashboard',
    path: '/dashboard',
    name: '物联大屏',
    isTopLevel: true
  },
  {
    id: 'statistics',
    path: '/statistics',
    name: '统计分析',
    isTopLevel: true,
    requiredPermission: 'statistics' // 需要 'statistics' 权限
  },
  {
    id: 'news',
    path: '/news',
    name: '消息中心',
    isTopLevel: true,
    requiredPermission: 'news' // 需要 'news' 权限
  }
  // 如果有二级菜单，可以这样组织，或者扁平化处理后在组件中构建层级
  // {
  //   id: 'management',
  //   name: '综合管理',
  //   isTopLevel: true,
  //   isBase: false, // 假设这个一级菜单本身也需要权限
  //   children: [
  //     { id: 'userManagement', path: '/users', name: '用户管理', isBase: false },
  //     { id: 'roleManagement', path: '/roles', name: '角色管理', isBase: false },
  //   ]
  // }
];
