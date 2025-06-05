import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: { 
    proxy: {
      '/api': { 
        target: 'http://localhost:8087', // 后端服务地址
        changeOrigin: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Origin', 'http://localhost:5173');
            proxyReq.setHeader('Referer', 'http://localhost:5173');
          });
        }
      },
      '/iot': {
        target: 'http://localhost:8086', // ymx-admin-iot模块的后端地址
        changeOrigin: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Origin', 'http://localhost:5173');
            proxyReq.setHeader('Referer', 'http://localhost:5173');
          });
        }
      },
      "/lh-cloud-wl": {
        target: "http://localhost:8087", // 更新: 后端服务的地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lh-cloud-wl/, ""),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Origin', 'http://localhost:5173');
            proxyReq.setHeader('Referer', 'http://localhost:5173');
          });
        }
      },
      '/amin': {
        target: 'http://localhost:8087', // 用户模块的后端地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amin/, '/api'),  // 修改这里，将/amin替换为/api
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Origin', 'http://localhost:5173');
            proxyReq.setHeader('Referer', 'http://localhost:5173');
          });
        }
      }
    }
  }
})
