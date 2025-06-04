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
      // 字符串简写写法
      // '/foo': 'http://localhost:4567',
      // 选项写法
      '/api': { 
        target: 'http://localhost:8085', // 更新: 后端服务实际地址
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') 
      },
      '/lh-cloud-wl': {
        target: 'http://localhost:8085', // 更新: 后端服务的地址
        changeOrigin: true, 
        rewrite: (path) => path.replace(/^\/lh-cloud-wl/, ''), 
      },
      // 正则表达式写法
      // '^/fallback/.*': {
      //   target: 'http://jsonplaceholder.typicode.com',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/fallback/, '')
      // }
    }
  }
})
