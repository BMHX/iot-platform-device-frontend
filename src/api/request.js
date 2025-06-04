import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建axios实例
const service = axios.create({
  baseURL: '', // 移除base_url前缀，完全依赖代理配置
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    console.log('请求URL:', config.url);
    console.log('请求方法:', config.method);
    console.log('请求参数:', config.params || config.data);
    
    // 可以从localStorage获取token并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    console.log('响应数据:', response.data);
    const res = response.data;
    
    // 检查响应结构
    if (res.code !== undefined) {
      // 标准响应结构: { code: 0, msg: '', data: xxx }
      if (res.code !== 0) {
        ElMessage.error(res.msg || '请求失败');
        return Promise.reject(new Error(res.msg || '请求失败'));
      } else {
        return res.data;
      }
    } else if (res && typeof res === 'object' && 'data' in res) {
      // 处理格式为 { data: xxx } 的响应
      return res.data;
    } else {
      // 其他结构，直接返回
      return res;
    }
  },
  error => {
    console.error('响应错误:', error);
    
    // 打印更多错误信息
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应头:', error.response.headers);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但未收到响应');
      console.error(error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    let message = error.message;
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '未授权，请重新登录';
          // 可以在这里处理登出逻辑
          break;
        case 403:
          message = '拒绝访问';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器内部错误';
          if (error.response.data && error.response.data.msg) {
            message += `: ${error.response.data.msg}`;
          }
          break;
        default:
          message = `请求错误: ${error.response.status}`;
      }
    }
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export default service; 